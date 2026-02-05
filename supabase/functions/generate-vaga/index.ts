 import "jsr:@supabase/functions-js/edge-runtime.d.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type",
 };
 
 Deno.serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { descricao } = await req.json();
 
     if (!descricao || descricao.trim().length < 10) {
       return new Response(
         JSON.stringify({ error: "Descrição muito curta. Forneça mais detalhes sobre a vaga." }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const systemPrompt = `Você é um especialista em Recursos Humanos de um escritório de advocacia. 
 Sua tarefa é analisar uma descrição de vaga e gerar TODOS os campos necessários para o cadastro.
 
 CONTEXTO: Escritório de advocacia com áreas jurídicas (trabalhista, previdenciário, bancário, cível), 
 comercial, administrativo e marketing.
 
 Com base na descrição fornecida, você deve inferir e preencher TODOS os campos abaixo:
 
 CAMPOS OBRIGATÓRIOS:
 - titulo: Título profissional da vaga (ex: "Advogado Trabalhista Pleno")
 - setor: Departamento (Jurídico, Comercial, Administrativo, Marketing, Financeiro, RH)
 - tipo_contrato: "clt", "pj" ou "estagio"
 - modalidade: "presencial", "hibrido" ou "remoto"
 - senioridade: "junior", "pleno" ou "senior"
 - experiencia_minima_anos: número inteiro (0 a 20)
 
 CAMPOS OPCIONAIS (preencha se conseguir inferir):
 - salario_min: valor numérico (sem R$, apenas número)
 - salario_max: valor numérico (sem R$, apenas número)
 - descricao: Descrição completa e profissional da vaga (2-3 parágrafos)
 - responsabilidades: Lista de responsabilidades principais (formato de texto corrido ou bullets)
 - hard_skills_obrigatorias: Array de strings com skills técnicas obrigatórias
 - hard_skills_desejaveis: Array de strings com skills técnicas desejáveis
 - soft_skills: Array de strings com habilidades comportamentais
 - formacao_minima: Formação acadêmica mínima exigida
 
 PESOS PARA SCORE (devem somar aproximadamente 100%):
 - peso_experiencia: padrão 40
 - peso_soft_skills: padrão 20
 - peso_formacao: padrão 15
 - peso_cursos: padrão 10
 - peso_fit_cultural: padrão 15
 
 REGRAS:
 1. Seja profissional e detalhado
 2. Para área jurídica, inclua conhecimentos específicos (OAB, áreas do direito, sistemas como PJe, etc.)
 3. Para área comercial, foque em vendas, negociação, CRM
 4. Para área administrativa, inclua conhecimentos de pacote Office, organização, etc.
 5. Infira a senioridade pelo contexto (experiência mencionada, complexidade das tarefas)
 6. Se salário não for mencionado, deixe null
 7. Se houver menção a regime de trabalho, use a modalidade correta
 
 RETORNE APENAS UM JSON VÁLIDO com os campos acima. Não inclua explicações.`;
 
     // Use Google Gemini via OpenAI-compatible endpoint
     const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${Deno.env.get("GEMINI_API_KEY")}`,
       },
       body: JSON.stringify({
         model: "gemini-2.0-flash",
         messages: [
           {
             role: "system",
             content: systemPrompt,
           },
           {
             role: "user",
             content: `Analise a seguinte descrição de vaga e gere todos os campos necessários para cadastro:
 
 "${descricao}"
 
 Retorne APENAS o JSON com os campos preenchidos.`,
           },
         ],
         temperature: 0.7,
         max_tokens: 2000,
       }),
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error("Gemini API error:", errorText);
       throw new Error(`Gemini API error: ${response.status}`);
     }
 
     const aiResponse = await response.json();
     const content = aiResponse.choices?.[0]?.message?.content || "";
 
     // Extract JSON from response
     let vagaData;
     try {
       // Try to find JSON in the response
       const jsonMatch = content.match(/\{[\s\S]*\}/);
       if (jsonMatch) {
         vagaData = JSON.parse(jsonMatch[0]);
       } else {
         throw new Error("No JSON found in response");
       }
     } catch (parseError) {
       console.error("Parse error:", parseError, "Content:", content);
       throw new Error("Não foi possível processar a resposta da IA");
     }
 
     // Validate and normalize the data
     const normalizedData = {
       titulo: vagaData.titulo || "",
       setor: vagaData.setor || "",
       tipo_contrato: ["clt", "pj", "estagio"].includes(vagaData.tipo_contrato) 
         ? vagaData.tipo_contrato 
         : "clt",
       modalidade: ["presencial", "hibrido", "remoto"].includes(vagaData.modalidade) 
         ? vagaData.modalidade 
         : "presencial",
       senioridade: ["junior", "pleno", "senior"].includes(vagaData.senioridade) 
         ? vagaData.senioridade 
         : "pleno",
       experiencia_minima_anos: typeof vagaData.experiencia_minima_anos === "number" 
         ? vagaData.experiencia_minima_anos 
         : 0,
       salario_min: typeof vagaData.salario_min === "number" ? vagaData.salario_min : null,
       salario_max: typeof vagaData.salario_max === "number" ? vagaData.salario_max : null,
       descricao: vagaData.descricao || "",
       responsabilidades: vagaData.responsabilidades || "",
       hard_skills_obrigatorias: Array.isArray(vagaData.hard_skills_obrigatorias) 
         ? vagaData.hard_skills_obrigatorias 
         : [],
       hard_skills_desejaveis: Array.isArray(vagaData.hard_skills_desejaveis) 
         ? vagaData.hard_skills_desejaveis 
         : [],
       soft_skills: Array.isArray(vagaData.soft_skills) ? vagaData.soft_skills : [],
       formacao_minima: vagaData.formacao_minima || "",
       peso_experiencia: vagaData.peso_experiencia || 40,
       peso_soft_skills: vagaData.peso_soft_skills || 20,
       peso_formacao: vagaData.peso_formacao || 15,
       peso_cursos: vagaData.peso_cursos || 10,
       peso_fit_cultural: vagaData.peso_fit_cultural || 15,
     };
 
     return new Response(
       JSON.stringify(normalizedData),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Error generating vaga:", error);
     return new Response(
       JSON.stringify({ error: error.message || "Erro ao processar a descrição da vaga" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });