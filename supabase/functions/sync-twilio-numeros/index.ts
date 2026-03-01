import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DDD_REGIAO: Record<string, string> = {
  "11": "São Paulo",
  "12": "São José dos Campos",
  "13": "Santos",
  "14": "Bauru",
  "15": "Sorocaba",
  "16": "Ribeirão Preto",
  "17": "São José do Rio Preto",
  "18": "Presidente Prudente",
  "19": "Campinas",
  "21": "Rio de Janeiro",
  "22": "Campos dos Goytacazes",
  "24": "Volta Redonda",
  "27": "Vitória",
  "28": "Cachoeiro de Itapemirim",
  "31": "Belo Horizonte",
  "32": "Juiz de Fora",
  "33": "Governador Valadares",
  "34": "Uberlândia",
  "35": "Poços de Caldas",
  "37": "Divinópolis",
  "38": "Montes Claros",
  "41": "Curitiba",
  "42": "Ponta Grossa",
  "43": "Londrina",
  "44": "Maringá",
  "45": "Foz do Iguaçu",
  "46": "Francisco Beltrão",
  "47": "Joinville",
  "48": "Florianópolis",
  "49": "Chapecó",
  "51": "Porto Alegre",
  "53": "Pelotas",
  "54": "Caxias do Sul",
  "55": "Santa Maria",
  "61": "Brasília",
  "62": "Goiânia",
  "63": "Palmas",
  "64": "Rio Verde",
  "65": "Cuiabá",
  "66": "Rondonópolis",
  "67": "Campo Grande",
  "68": "Rio Branco",
  "69": "Porto Velho",
  "71": "Salvador",
  "73": "Ilhéus",
  "74": "Juazeiro",
  "75": "Feira de Santana",
  "77": "Vitória da Conquista",
  "79": "Aracaju",
  "81": "Recife",
  "82": "Maceió",
  "83": "João Pessoa",
  "84": "Natal",
  "85": "Fortaleza",
  "86": "Teresina",
  "87": "Petrolina",
  "88": "Juazeiro do Norte",
  "89": "Picos",
  "91": "Belém",
  "92": "Manaus",
  "93": "Santarém",
  "94": "Marabá",
  "95": "Boa Vista",
  "96": "Macapá",
  "97": "Coari",
  "98": "São Luís",
  "99": "Imperatriz",
};

function extractDdd(numero: string): string {
  // +55XX... → positions 3-4
  if (numero.startsWith("+55") && numero.length >= 5) {
    return numero.substring(3, 5);
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem sincronizar números" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch numbers from Twilio
    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    const basicAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/IncomingPhoneNumbers.json?PageSize=1000`,
      { headers: { Authorization: `Basic ${basicAuth}` } }
    );

    if (!twilioRes.ok) {
      const errText = await twilioRes.text();
      console.error("Twilio API error:", errText);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar números do Twilio" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const twilioData = await twilioRes.json();
    const incomingNumbers = twilioData.incoming_phone_numbers || [];

    let inserted = 0;
    let existing = 0;

    for (const num of incomingNumbers) {
      const numero = num.phone_number; // E.164 format
      const ddd = extractDdd(numero);
      const regiao = DDD_REGIAO[ddd] || null;

      const { error: upsertError, data } = await adminClient
        .from("twilio_numeros")
        .upsert(
          { numero, ddd, regiao, ativo: true },
          { onConflict: "numero" }
        )
        .select("id")
        .single();

      if (upsertError) {
        console.error("Upsert error for", numero, upsertError.message);
        // If conflict with no change, count as existing
        existing++;
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        total: incomingNumbers.length,
        importados: inserted,
        existentes: existing,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-twilio-numeros error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
