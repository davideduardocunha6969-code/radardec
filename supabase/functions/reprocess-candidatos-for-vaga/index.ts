 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface Vaga {
   id: string;
   titulo: string;
   setor: string;
   senioridade: string;
   experiencia_minima_anos: number;
   formacao_minima: string | null;
   hard_skills_obrigatorias: string[] | null;
   hard_skills_desejaveis: string[] | null;
   soft_skills: string[] | null;
   peso_experiencia: number;
   peso_soft_skills: number;
   peso_formacao: number;
   peso_cursos: number;
   peso_fit_cultural: number;
 }
 
 interface Candidato {
   id: string;
   nome: string;
   experiencia_total_anos: number;
   ultimo_cargo: string | null;
   formacao: string | null;
   skills_detectadas: string[] | null;
   cursos_extras: string[] | null;
   resumo: string | null;
 }
 
 async function analyzeForVaga(
   vaga: Vaga,
   candidato: Candidato,
   LOVABLE_API_KEY: string
 ): Promise<{ score_total: number; score_detalhado: Record<string, number>; explicacao_score: string }> {
   const systemPrompt = `Você é um especialista em análise de currículos para um escritório de advocacia.
 
 VAGA: ${vaga.titulo}
 SETOR: ${vaga.setor}
 SENIORIDADE: ${vaga.senioridade}
 EXPERIÊNCIA MÍNIMA: ${vaga.experiencia_minima_anos} anos
 FORMAÇÃO MÍNIMA: ${vaga.formacao_minima || "Não especificada"}
 
 HARD SKILLS OBRIGATÓRIAS: ${(vaga.hard_skills_obrigatorias || []).join(", ") || "Não especificadas"}
 HARD SKILLS DESEJÁVEIS: ${(vaga.hard_skills_desejaveis || []).join(", ") || "Não especificadas"}
 SOFT SKILLS: ${(vaga.soft_skills || []).join(", ") || "Não especificadas"}
 
 PESOS:
 - Experiência: ${vaga.peso_experiencia}%
 - Soft Skills: ${vaga.peso_soft_skills}%
 - Formação: ${vaga.peso_formacao}%
 - Cursos: ${vaga.peso_cursos}%
 - Fit Cultural: ${vaga.peso_fit_cultural}%
 
 CANDIDATO:
 - Nome: ${candidato.nome}
 - Experiência: ${candidato.experiencia_total_anos} anos
 - Último cargo: ${candidato.ultimo_cargo || "Não informado"}
 - Formação: ${candidato.formacao || "Não informada"}
 - Skills: ${(candidato.skills_detectadas || []).join(", ")}
 - Cursos extras: ${(candidato.cursos_extras || []).join(", ")}
 - Resumo: ${candidato.resumo || "Não disponível"}
 
 Retorne apenas um JSON:
 {
   "score_total": número de 0 a 100,
   "score_detalhado": {
     "experiencia": número de 0 a 100,
     "soft_skills": número de 0 a 100,
     "formacao": número de 0 a 100,
     "cursos": número de 0 a 100,
     "fit_cultural": número de 0 a 100
   },
   "explicacao_score": "Explicação breve"
 }`;
 
   const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
     method: "POST",
     headers: {
       Authorization: `Bearer ${LOVABLE_API_KEY}`,
       "Content-Type": "application/json",
     },
     body: JSON.stringify({
       model: "google/gemini-2.5-flash",
       messages: [
         { role: "system", content: systemPrompt },
         { role: "user", content: "Analise e retorne apenas o JSON." },
       ],
       temperature: 0.3,
     }),
   });
 
   if (!response.ok) {
     return { score_total: 0, score_detalhado: {}, explicacao_score: "Erro na análise" };
   }
 
   const result = await response.json();
   const content = result.choices?.[0]?.message?.content || "";
 
   try {
     const jsonMatch = content.match(/\{[\s\S]*\}/);
     if (jsonMatch) {
       return JSON.parse(jsonMatch[0]);
     }
   } catch (e) {
     console.error("Parse error");
   }
 
   return { score_total: 0, score_detalhado: {}, explicacao_score: "Erro" };
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) throw new Error("Missing authorization header");
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey, {
       global: { headers: { Authorization: authHeader } },
     });
 
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) throw new Error("Not authenticated");
 
     const { vagaId } = await req.json();
     if (!vagaId) throw new Error("Missing vagaId");
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
 
     // Get vaga
     const { data: vaga, error: vagaError } = await supabase
       .from("vagas_recrutamento")
       .select("*")
       .eq("id", vagaId)
       .single();
 
     if (vagaError || !vaga) throw new Error("Vaga not found");
 
     // Get all candidatos
     const { data: candidatos, error: candidatosError } = await supabase
       .from("candidatos")
       .select("*");
 
     if (candidatosError) throw candidatosError;
 
     let processed = 0;
     for (const candidato of candidatos || []) {
       const analysis = await analyzeForVaga(vaga as Vaga, candidato as Candidato, LOVABLE_API_KEY);
 
       // Get latest curriculo for this candidato
       const { data: curriculo } = await supabase
         .from("curriculos")
         .select("id")
         .eq("candidato_id", candidato.id)
         .order("created_at", { ascending: false })
         .limit(1)
         .single();
 
       // Check if relation exists
       const { data: existing } = await supabase
         .from("candidato_vaga")
         .select("id")
         .eq("candidato_id", candidato.id)
         .eq("vaga_id", vagaId)
         .single();
 
       if (existing) {
         await supabase
           .from("candidato_vaga")
           .update({
             score_total: analysis.score_total,
             score_detalhado: analysis.score_detalhado,
             explicacao_score: analysis.explicacao_score,
             curriculo_id: curriculo?.id || null,
           })
           .eq("id", existing.id);
       } else {
         await supabase.from("candidato_vaga").insert({
           candidato_id: candidato.id,
           vaga_id: vagaId,
           curriculo_id: curriculo?.id || null,
           score_total: analysis.score_total,
           score_detalhado: analysis.score_detalhado,
           explicacao_score: analysis.explicacao_score,
           status: "triagem_ia",
           user_id: user.id,
         });
       }
 
       processed++;
     }
 
     return new Response(
       JSON.stringify({ success: true, processed }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error: any) {
     console.error("Error:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });