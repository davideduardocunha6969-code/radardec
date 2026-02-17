import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SdrStats {
  userId: string;
  nome: string;
  totalChamadas: number;
  atendidas: number;
  naoAtendidas: number;
  finalizadas: number;
  duracaoMediaSegundos: number;
  notaMedia: number | null;
}

export interface HourlyData {
  hora: string;
  efetuadas: number;
  atendidas: number;
}

export interface FunilOption {
  id: string;
  nome: string;
}

function computeStats(chamadas: any[], profileMap: Map<string, string>) {
  const grouped = new Map<string, any[]>();
  chamadas.forEach((c) => {
    if (!grouped.has(c.user_id)) grouped.set(c.user_id, []);
    grouped.get(c.user_id)!.push(c);
  });

  const sdrStats: SdrStats[] = Array.from(grouped.entries()).map(([userId, calls]) => {
    const finalizadas = calls.filter((c) => c.status === "finalizada").length;
    const naoAtendidas = calls.filter((c) => c.status === "nao_atendida").length;

    const duracoes = calls
      .map((c) => c.duracao_segundos)
      .filter((d): d is number => d != null && d > 0);
    const duracaoMedia = duracoes.length
      ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
      : 0;

    const notas = calls
      .map((c) => c.nota_ia)
      .filter((n): n is number => n != null);
    const notaMedia = notas.length
      ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
      : null;

    return {
      userId,
      nome: profileMap.get(userId) || "Desconhecido",
      totalChamadas: calls.length,
      atendidas: finalizadas,
      naoAtendidas,
      finalizadas,
      duracaoMediaSegundos: duracaoMedia,
      notaMedia,
    };
  });

  sdrStats.sort((a, b) => b.totalChamadas - a.totalChamadas);

  const totalGeral = chamadas.length;
  const totalFinalizadas = chamadas.filter((c) => c.status === "finalizada").length;
  const totalNaoAtendidas = chamadas.filter((c) => c.status === "nao_atendida").length;
  const allDuracoes = chamadas
    .map((c) => c.duracao_segundos)
    .filter((d): d is number => d != null && d > 0);
  const duracaoMediaGeral = allDuracoes.length
    ? Math.round(allDuracoes.reduce((a, b) => a + b, 0) / allDuracoes.length)
    : 0;
  const allNotas = chamadas
    .map((c) => c.nota_ia)
    .filter((n): n is number => n != null);
  const notaMediaGeral = allNotas.length
    ? Math.round((allNotas.reduce((a, b) => a + b, 0) / allNotas.length) * 10) / 10
    : null;

  // Hourly distribution
  const horaEfetuadas = new Array(24).fill(0);
  const horaAtendidas = new Array(24).fill(0);
  chamadas.forEach((c) => {
    if (!c.created_at) return;
    const hour = new Date(c.created_at).getHours();
    horaEfetuadas[hour]++;
    if (c.status === "finalizada") horaAtendidas[hour]++;
  });

  const hourlyData: HourlyData[] = [];
  for (let h = 6; h <= 22; h++) {
    hourlyData.push({
      hora: `${h.toString().padStart(2, "0")}h`,
      efetuadas: horaEfetuadas[h],
      atendidas: horaAtendidas[h],
    });
  }

  return {
    sdrStats,
    totalGeral,
    totalFinalizadas,
    totalNaoAtendidas,
    duracaoMediaGeral,
    notaMediaGeral,
    hourlyData,
  };
}

export function useRadarOutbound() {
  return useQuery({
    queryKey: ["radar-outbound"],
    queryFn: async () => {
      const [chamadasRes, profilesRes, leadsRes, funisRes] = await Promise.all([
        supabase.from("crm_chamadas").select("id, user_id, lead_id, status, duracao_segundos, nota_ia, created_at, canal"),
        supabase.from("profiles").select("user_id, display_name"),
        supabase.from("crm_leads").select("id, funil_id"),
        supabase.from("crm_funis").select("id, nome"),
      ]);

      if (chamadasRes.error) throw chamadasRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (leadsRes.error) throw leadsRes.error;
      if (funisRes.error) throw funisRes.error;

      const chamadas = chamadasRes.data || [];
      const profiles = profilesRes.data || [];
      const leads = leadsRes.data || [];
      const funis = funisRes.data || [];

      const profileMap = new Map(profiles.map((p) => [p.user_id, p.display_name]));
      const leadFunilMap = new Map(leads.map((l) => [l.id, l.funil_id]));

      // Enrich chamadas with funil_id
      const enriched = chamadas.map((c) => ({
        ...c,
        funil_id: leadFunilMap.get(c.lead_id) || null,
      }));

      const funisOptions: FunilOption[] = funis.map((f) => ({ id: f.id, nome: f.nome }));

      return {
        allChamadas: enriched,
        profileMap,
        funisOptions,
        ...computeStats(enriched, profileMap),
      };
    },
  });
}

export function filterByFunil(
  allChamadas: any[],
  profileMap: Map<string, string>,
  funilId: string | null
) {
  const filtered = funilId
    ? allChamadas.filter((c) => c.funil_id === funilId)
    : allChamadas;
  return computeStats(filtered, profileMap);
}
