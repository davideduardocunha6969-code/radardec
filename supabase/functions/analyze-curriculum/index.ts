 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const authHeader = req.headers.get("Authorization");
     if (!authHeader) {
       throw new Error("Missing authorization header");
     }
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey, {
       global: { headers: { Authorization: authHeader } },
     });
 
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) {
       throw new Error("Not authenticated");
     }
 
     const { fileUrl, fileName, vagaId } = await req.json();
 
     if (!fileUrl || !vagaId) {
       throw new Error("Missing required fields: fileUrl, vagaId");
     }
 
     // Get vaga details
     const { data: vaga, error: vagaError } = await supabase
       .from("vagas_recrutamento")
       .select("*")
       .eq("id", vagaId)
       .single();
 
     if (vagaError || !vaga) {
       throw new Error("Vaga not found");
     }
 
     // Download file content
     const fileResponse = await fetch(fileUrl);
     if (!fileResponse.ok) {
       throw new Error("Failed to download file");
     }
 
     // For now, we'll simulate text extraction. In production, you'd use a PDF/DOCX parser
     // or the Lovable AI with document parsing capabilities
     const fileBuffer = await fileResponse.arrayBuffer();
     const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
 
     // Call Lovable AI to analyze the curriculum
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY not configured");
     }
 
     const systemPrompt = `Você é um especialista em análise de currículos para um escritório de advocacia.
 
 VAGA: ${vaga.titulo}
 SETOR: ${vaga.setor}
 SENIORIDADE: ${vaga.senioridade}
 EXPERIÊNCIA MÍNIMA: ${vaga.experiencia_minima_anos} anos
 FORMAÇÃO MÍNIMA: ${vaga.formacao_minima || "Não especificada"}
 
 HARD SKILLS OBRIGATÓRIAS: ${(vaga.hard_skills_obrigatorias || []).join(", ") || "Não especificadas"}
 HARD SKILLS DESEJÁVEIS: ${(vaga.hard_skills_desejaveis || []).join(", ") || "Não especificadas"}
 SOFT SKILLS: ${(vaga.soft_skills || []).join(", ") || "Não especificadas"}
 
 PESOS PARA CÁLCULO:
 - Experiência: ${vaga.peso_experiencia}%
 - Soft Skills: ${vaga.peso_soft_skills}%
 - Formação: ${vaga.peso_formacao}%
 - Cursos: ${vaga.peso_cursos}%
 - Fit Cultural: ${vaga.peso_fit_cultural}%
 
 Analise o currículo e retorne um JSON com a seguinte estrutura:
 {
   "nome": "Nome completo do candidato",
   "email": "Email do candidato",
   "telefone": "Telefone (se encontrado)",
   "linkedin_url": "URL do LinkedIn (se encontrada)",
   "experiencia_total_anos": número de anos de experiência total,
   "ultimo_cargo": "Último cargo ocupado",
   "formacao": "Formação acadêmica principal",
   "skills_detectadas": ["skill1", "skill2", ...],
   "cursos_extras": ["curso1", "curso2", ...],
   "idiomas": ["idioma1", "idioma2", ...],
   "resumo": "Resumo profissional em 2-3 frases",
   "score_total": número de 0 a 100 representando compatibilidade,
   "score_detalhado": {
     "experiencia": número de 0 a 100,
     "soft_skills": número de 0 a 100,
     "formacao": número de 0 a 100,
     "cursos": número de 0 a 100,
     "fit_cultural": número de 0 a 100
   },
   "explicacao_score": "Explicação detalhada de por que este candidato recebeu esta nota, incluindo pontos fortes e fracos",
   "pontos_fortes": ["ponto1", "ponto2", ...],
   "pontos_fracos": ["ponto1", "ponto2", ...]
 }
 
 Use análise semântica para identificar sinônimos (ex: "advogado contencioso" = "advocacia judicial").
 Seja preciso na identificação de experiências jurídicas.
 O score deve refletir a compatibilidade real com a vaga.`;
 
     const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-2.5-flash",
         messages: [
           { role: "system", content: systemPrompt },
           {
             role: "user",
             content: `Analise este currículo (arquivo: ${fileName}). O conteúdo está em base64: ${fileBase64.substring(0, 50000)}`,
           },
         ],
         temperature: 0.3,
       }),
     });
 
     if (!aiResponse.ok) {
       const errorText = await aiResponse.text();
       console.error("AI error:", errorText);
       throw new Error("Failed to analyze curriculum with AI");
     }
 
     const aiResult = await aiResponse.json();
     const content = aiResult.choices?.[0]?.message?.content || "";
 
     // Parse JSON from AI response
     let analysis;
     try {
       const jsonMatch = content.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         analysis = JSON.parse(jsonMatch[0]);
       } else {
         throw new Error("No JSON found in AI response");
       }
     } catch (parseError) {
       console.error("Failed to parse AI response:", content);
       throw new Error("Failed to parse AI analysis");
     }
 
     // Check if candidate already exists
     let candidatoId: string;
     const { data: existingCandidato } = await supabase
       .from("candidatos")
       .select("id")
       .eq("email", analysis.email)
       .single();
 
     if (existingCandidato) {
       candidatoId = existingCandidato.id;
       // Update existing candidate
       await supabase
         .from("candidatos")
         .update({
           nome: analysis.nome,
           telefone: analysis.telefone,
           linkedin_url: analysis.linkedin_url,
           experiencia_total_anos: analysis.experiencia_total_anos,
           ultimo_cargo: analysis.ultimo_cargo,
           formacao: analysis.formacao,
           skills_detectadas: analysis.skills_detectadas,
           cursos_extras: analysis.cursos_extras,
           idiomas: analysis.idiomas,
           resumo: analysis.resumo,
           dados_extraidos: analysis,
         })
         .eq("id", candidatoId);
     } else {
       // Create new candidate
       const { data: newCandidato, error: candidatoError } = await supabase
         .from("candidatos")
         .insert({
           nome: analysis.nome || "Candidato Desconhecido",
           email: analysis.email || `unknown-${Date.now()}@temp.com`,
           telefone: analysis.telefone,
           linkedin_url: analysis.linkedin_url,
           experiencia_total_anos: analysis.experiencia_total_anos || 0,
           ultimo_cargo: analysis.ultimo_cargo,
           formacao: analysis.formacao,
           skills_detectadas: analysis.skills_detectadas || [],
           cursos_extras: analysis.cursos_extras || [],
           idiomas: analysis.idiomas || [],
           resumo: analysis.resumo,
           dados_extraidos: analysis,
           user_id: user.id,
         })
         .select()
         .single();
 
       if (candidatoError) {
         console.error("Error creating candidato:", candidatoError);
         throw new Error("Failed to create candidate");
       }
       candidatoId = newCandidato.id;
     }
 
     // Create curriculum record
     const { data: curriculo, error: curriculoError } = await supabase
       .from("curriculos")
       .insert({
         candidato_id: candidatoId,
         arquivo_nome: fileName,
         arquivo_url: fileUrl,
         arquivo_tipo: fileName.split(".").pop(),
         texto_extraido: content,
         processado: true,
         user_id: user.id,
       })
       .select()
       .single();
 
     if (curriculoError) {
       console.error("Error creating curriculo:", curriculoError);
       throw new Error("Failed to create curriculum record");
     }
 
     // Create or update candidato_vaga relationship
     const { data: existingRelation } = await supabase
       .from("candidato_vaga")
       .select("id")
       .eq("candidato_id", candidatoId)
       .eq("vaga_id", vagaId)
       .single();
 
     if (existingRelation) {
       await supabase
         .from("candidato_vaga")
         .update({
           curriculo_id: curriculo.id,
           score_total: analysis.score_total || 0,
           score_detalhado: analysis.score_detalhado || {},
           explicacao_score: analysis.explicacao_score,
         })
         .eq("id", existingRelation.id);
     } else {
       await supabase.from("candidato_vaga").insert({
         candidato_id: candidatoId,
         vaga_id: vagaId,
         curriculo_id: curriculo.id,
         score_total: analysis.score_total || 0,
         score_detalhado: analysis.score_detalhado || {},
         explicacao_score: analysis.explicacao_score,
         status: "triagem_ia",
         user_id: user.id,
       });
     }
 
     // Create analysis record
     await supabase.from("analises_curriculo").insert({
       curriculo_id: curriculo.id,
       vaga_id: vagaId,
       prompt_usado: systemPrompt,
       resposta_ia: analysis,
       score_calculado: analysis.score_total,
       match_skills: { skills: analysis.skills_detectadas },
       match_experiencia: { anos: analysis.experiencia_total_anos },
       match_formacao: { formacao: analysis.formacao },
       pontos_fortes: analysis.pontos_fortes || [],
       pontos_fracos: analysis.pontos_fracos || [],
       recomendacao: analysis.explicacao_score,
       user_id: user.id,
     });
 
     return new Response(
       JSON.stringify({
         success: true,
         candidatoId,
         score: analysis.score_total,
       }),
       {
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   } catch (error: any) {
     console.error("Error in analyze-curriculum:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       }
     );
   }
 });