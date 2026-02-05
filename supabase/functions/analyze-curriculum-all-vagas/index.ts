 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };

function parseStorageObjectUrl(fileUrl: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(fileUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/(?:public\/)?([^/]+)\/(.+)$/);
    if (!match) return null;
    return {
      bucket: decodeURIComponent(match[1]),
      path: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return bytesToBase64(new Uint8Array(buffer));
}

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default: return 'application/octet-stream';
  }
}

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
 
 async function analyzeForVaga(
   vaga: Vaga,
   candidatoData: Record<string, any>,
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
 
 PESOS PARA CÁLCULO:
 - Experiência: ${vaga.peso_experiencia}%
 - Soft Skills: ${vaga.peso_soft_skills}%
 - Formação: ${vaga.peso_formacao}%
 - Cursos: ${vaga.peso_cursos}%
 - Fit Cultural: ${vaga.peso_fit_cultural}%
 
 DADOS DO CANDIDATO:
 - Nome: ${candidatoData.nome}
 - Experiência: ${candidatoData.experiencia_total_anos} anos
 - Último cargo: ${candidatoData.ultimo_cargo || "Não informado"}
 - Formação: ${candidatoData.formacao || "Não informada"}
 - Skills: ${(candidatoData.skills_detectadas || []).join(", ")}
 - Cursos extras: ${(candidatoData.cursos_extras || []).join(", ")}
 - Resumo: ${candidatoData.resumo || "Não disponível"}
 
 Analise a compatibilidade deste candidato com a vaga e retorne um JSON:
 {
   "score_total": número de 0 a 100,
   "score_detalhado": {
     "experiencia": número de 0 a 100,
     "soft_skills": número de 0 a 100,
     "formacao": número de 0 a 100,
     "cursos": número de 0 a 100,
     "fit_cultural": número de 0 a 100
   },
   "explicacao_score": "Explicação breve da pontuação, pontos fortes e fracos"
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
     console.error(`Error analyzing for vaga ${vaga.id}`);
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
     console.error("Failed to parse response for vaga", vaga.id);
   }
 
   return { score_total: 0, score_detalhado: {}, explicacao_score: "Erro ao processar resposta" };
 }
 
async function extractCvDataWithVision(
  fileBase64: string,
  mimeType: string,
  fileName: string,
  LOVABLE_API_KEY: string
): Promise<Record<string, any>> {
  const extractionPrompt = `Você é um especialista em análise de currículos para um escritório de advocacia.

Analise o currículo anexado e extraia TODAS as informações reais presentes no documento.
NÃO INVENTE informações. Se algo não estiver presente, marque como null.

Retorne APENAS um JSON válido (sem markdown, sem blocos de código):
{
  "nome": "Nome completo do candidato (string ou null)",
  "email": "Email do candidato (string ou null)",
  "telefone": "Telefone (string ou null)",
  "linkedin_url": "URL do LinkedIn (string ou null)",
  "experiencia_total_anos": número de anos de experiência (number ou null),
  "ultimo_cargo": "Último cargo ocupado (string ou null)",
  "formacao": "Formação acadêmica principal (string ou null)",
  "skills_detectadas": ["skill1", "skill2"] (array de strings reais do currículo),
  "cursos_extras": ["curso1", "curso2"] (array de strings),
  "idiomas": ["idioma1", "idioma2"] (array de strings),
  "resumo": "Resumo profissional em 2-3 frases baseado no conteúdo real do currículo"
}

IMPORTANTE: Extraia APENAS informações que realmente existem no documento. Não liste skills genéricas.`;

  console.log(`Extracting CV data from ${fileName} (${mimeType}), base64 size: ${fileBase64.length} chars`);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: extractionPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${fileBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Vision API error:", errorText);
    throw new Error(`Vision API failed: ${response.status}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content || "";
  
  console.log("Vision API response preview:", content.substring(0, 500));

  // Parse JSON from response (handle markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  } else {
    const rawJsonMatch = content.match(/\{[\s\S]*\}/);
    if (rawJsonMatch) {
      jsonStr = rawJsonMatch[0];
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse CV extraction response:", e, "Content:", jsonStr.substring(0, 200));
    throw new Error("Failed to parse CV data");
  }
}

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
 
      const body = await req.json().catch(() => ({}));
      const fileUrl: string | undefined = body?.fileUrl;
      const fileName: string | undefined = body?.fileName;
      const filePath: string | undefined = body?.filePath;
      const bucketFromBody: string | undefined = body?.bucket;

      if (!fileUrl && !filePath) {
        throw new Error("Missing required field: fileUrl or filePath");
      }
 
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY not configured");
     }
 
     // Get all open vagas
     const { data: vagas, error: vagasError } = await supabase
       .from("vagas_recrutamento")
       .select("*")
       .eq("status", "aberta");
 
     if (vagasError) throw vagasError;
 
      // Download and analyze file content
      // NOTE: The "curriculos" bucket is private, so we must not rely on public URLs.
      // We download via storage using the service role key (server-side only).
      let fileBuffer: ArrayBuffer | null = null;

      const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      const urlParsed = fileUrl ? parseStorageObjectUrl(fileUrl) : null;
      const bucket = bucketFromBody || urlParsed?.bucket || "curriculos";
      const objectPath = filePath || urlParsed?.path;
      const arquivoUrlParaSalvar = fileUrl || objectPath || "";

      if (supabaseServiceRoleKey && objectPath) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
        const { data: blob, error: downloadError } = await supabaseAdmin.storage
          .from(bucket)
          .download(objectPath);

        if (downloadError) {
          console.error("Storage download error:", downloadError);
        } else if (blob) {
          fileBuffer = await blob.arrayBuffer();
        }
      }

      // Fallback to fetching URL (works only if URL is truly public)
      if (!fileBuffer && fileUrl) {
        const fileResponse = await fetch(fileUrl);
        if (!fileResponse.ok) {
          throw new Error(`Failed to download file (status ${fileResponse.status})`);
        }
        fileBuffer = await fileResponse.arrayBuffer();
      }

      if (!fileBuffer) {
        throw new Error("Failed to download file");
      }

    // Convert file to base64 for vision API
    const fileBase64 = arrayBufferToBase64(fileBuffer);
    const mimeType = getMimeType(fileName || "document.pdf");

    // Extract candidate data using vision API (supports PDF directly)
    const candidatoData = await extractCvDataWithVision(
      fileBase64,
      mimeType,
      fileName || "curriculo.pdf",
      LOVABLE_API_KEY
    );

    console.log("Extracted candidate data:", JSON.stringify(candidatoData).substring(0, 500));
 
     // Create or update candidato
     let candidatoId: string;
    // Normalize email - treat null-like values as missing
    const normalizedEmail = candidatoData.email && 
      candidatoData.email !== "null" && 
      candidatoData.email !== "Não encontrado" &&
      candidatoData.email.includes("@")
        ? candidatoData.email 
        : null;
    
     const { data: existingCandidato } = await supabase
       .from("candidatos")
       .select("id")
      .eq("email", normalizedEmail || `candidato-${Date.now()}@temp.com`)
       .single();
 
     if (existingCandidato) {
       candidatoId = existingCandidato.id;
       await supabase
         .from("candidatos")
         .update({
           nome: candidatoData.nome,
           telefone: candidatoData.telefone,
           linkedin_url: candidatoData.linkedin_url,
           experiencia_total_anos: candidatoData.experiencia_total_anos || 0,
           ultimo_cargo: candidatoData.ultimo_cargo,
           formacao: candidatoData.formacao,
           skills_detectadas: candidatoData.skills_detectadas || [],
           cursos_extras: candidatoData.cursos_extras || [],
           idiomas: candidatoData.idiomas || [],
           resumo: candidatoData.resumo,
           dados_extraidos: candidatoData,
         })
         .eq("id", candidatoId);
     } else {
       const { data: newCandidato, error: candidatoError } = await supabase
         .from("candidatos")
         .insert({
           nome: candidatoData.nome || "Candidato Desconhecido",
           email: normalizedEmail || `candidato-${Date.now()}@temp.com`,
           telefone: candidatoData.telefone,
           linkedin_url: candidatoData.linkedin_url,
           experiencia_total_anos: candidatoData.experiencia_total_anos || 0,
           ultimo_cargo: candidatoData.ultimo_cargo,
           formacao: candidatoData.formacao,
           skills_detectadas: candidatoData.skills_detectadas || [],
           cursos_extras: candidatoData.cursos_extras || [],
           idiomas: candidatoData.idiomas || [],
           resumo: candidatoData.resumo,
           dados_extraidos: candidatoData,
           user_id: user.id,
         })
         .select()
         .single();
 
       if (candidatoError) throw candidatoError;
       candidatoId = newCandidato.id;
     }
 
     // Create curriculum record
     const { data: curriculo, error: curriculoError } = await supabase
       .from("curriculos")
       .insert({
         candidato_id: candidatoId,
          arquivo_nome: fileName || "curriculo",
          arquivo_url: arquivoUrlParaSalvar,
          arquivo_tipo: (fileName || "").includes(".") ? (fileName || "").split(".").pop() : null,
         texto_extraido: JSON.stringify(candidatoData, null, 2),
         processado: true,
         user_id: user.id,
       })
       .select()
       .single();
 
     if (curriculoError) throw curriculoError;
 
     // Analyze for each open vaga
     const analysisResults = [];
     for (const vaga of vagas || []) {
       const analysis = await analyzeForVaga(vaga as Vaga, candidatoData, LOVABLE_API_KEY);
 
       // Check if relation exists
       const { data: existingRelation } = await supabase
         .from("candidato_vaga")
         .select("id")
         .eq("candidato_id", candidatoId)
         .eq("vaga_id", vaga.id)
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
           vaga_id: vaga.id,
           curriculo_id: curriculo.id,
           score_total: analysis.score_total || 0,
           score_detalhado: analysis.score_detalhado || {},
           explicacao_score: analysis.explicacao_score,
           status: "triagem_ia",
           user_id: user.id,
         });
       }
 
       analysisResults.push({
         vagaId: vaga.id,
         vagaTitulo: vaga.titulo,
         score: analysis.score_total,
       });
     }
 
     return new Response(
       JSON.stringify({
         success: true,
         candidatoId,
         vagasAnalisadas: analysisResults.length,
         resultados: analysisResults,
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error: any) {
     console.error("Error in analyze-curriculum-all-vagas:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });