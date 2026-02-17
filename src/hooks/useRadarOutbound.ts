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
  taxaContato: number;
}

export interface HourlyData {
  hora: string;
  efetuadas: number;
  atendidas: number;
}

export interface DailyData {
  dia: string;
  efetuadas: number;
  atendidas: number;
}

export interface PsychStateData {
  estado: string;
  total: number;
  convertidos: number;
  taxa: number;
}

export interface FunilOption {
  id: string;
  nome: string;
}

function parsePsychState(feedback: string | null): string | null {
  if (!feedback) return null;
  // Look for "Análise Psicológica" or "Estado Psicológico" or "Estado Emocional" sections
  const patterns = [
    /(?:an[aá]lise\s+psicol[oó]gica|estado\s+(?:psicol[oó]gico|emocional))[:\s]*[^\n]*?(?:lead[:\s]*)?([^\n,.(]+)/i,
    /estado\s+(?:do\s+lead|emocional|psicol[oó]gico)[:\s]*\**\s*([^*\n,.(]+)/i,
    /psicol[oó]gic[oa][:\s]*\**\s*([^*\n,.(]+)/i,
  ];
  for (const pattern of patterns) {
    const match = feedback.match(pattern);
    if (match?.[1]) {
      const state = match[1].trim().replace(/\*+/g, '').trim();
      if (state.length > 2 && state.length < 60) return state;
    }
  }
  return null;
}

function parseRapovecaMalGerida(feedback: string | null): boolean {
  if (!feedback) return false;
  const lower = feedback.toLowerCase();
  // Check if RAPOVECA/RALOCA section mentions "mal gerida", "inadequad", "fraca", "insuficiente"
  const rapovecaIdx = lower.indexOf('rapoveca');
  const ralocaIdx = lower.indexOf('raloca');
  const idx = rapovecaIdx >= 0 ? rapovecaIdx : ralocaIdx;
  if (idx < 0) return false;
  // Check a 500-char window after the keyword
  const section = lower.substring(idx, idx + 500);
  return /mal\s*gerid|inadequad|fraca|insuficiente|n[aã]o\s*aplic|aus[eê]n/i.test(section);
}

function parseAgendamento(feedback: string | null): boolean {
  if (!feedback) return false;
  const lower = feedback.toLowerCase();
  return /agend(?:amento|ou|ada|ado)|show\s*rate[:\s]*(?:alt[oa]|[7-9]\d|100)/i.test(lower);
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

    const taxaContato = calls.length > 0 ? Math.round((finalizadas / calls.length) * 100) : 0;

    return {
      userId,
      nome: profileMap.get(userId) || "Desconhecido",
      totalChamadas: calls.length,
      atendidas: finalizadas,
      naoAtendidas,
      finalizadas,
      duracaoMediaSegundos: duracaoMedia,
      notaMedia,
      taxaContato,
    };
  });

  sdrStats.sort((a, b) => b.totalChamadas - a.totalChamadas);

  const totalGeral = chamadas.length;
  const totalFinalizadas = chamadas.filter((c) => c.status === "finalizada").length;
  const totalNaoAtendidas = chamadas.filter((c) => c.status === "nao_atendida").length;
  const taxaContatoGeral = totalGeral > 0 ? Math.round((totalFinalizadas / totalGeral) * 100) : 0;

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

  // Taxa de agendamento
  const chamadasComFeedback = chamadas.filter((c) => c.feedback_ia);
  const agendamentos = chamadasComFeedback.filter((c) => parseAgendamento(c.feedback_ia)).length;
  const taxaAgendamento = chamadasComFeedback.length > 0
    ? Math.round((agendamentos / chamadasComFeedback.length) * 100)
    : 0;

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

  // Daily distribution
  const dailyMap = new Map<string, { efetuadas: number; atendidas: number }>();
  chamadas.forEach((c) => {
    if (!c.created_at) return;
    const dia = new Date(c.created_at).toISOString().slice(0, 10);
    if (!dailyMap.has(dia)) dailyMap.set(dia, { efetuadas: 0, atendidas: 0 });
    const entry = dailyMap.get(dia)!;
    entry.efetuadas++;
    if (c.status === "finalizada") entry.atendidas++;
  });
  const dailyData: DailyData[] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, vals]) => ({
      dia: dia.slice(5), // MM-DD
      ...vals,
    }));

  // Estado psicológico
  const psychMap = new Map<string, { total: number; convertidos: number }>();
  chamadas.forEach((c) => {
    const estado = parsePsychState(c.feedback_ia);
    if (!estado) return;
    const normalized = estado.charAt(0).toUpperCase() + estado.slice(1).toLowerCase();
    if (!psychMap.has(normalized)) psychMap.set(normalized, { total: 0, convertidos: 0 });
    const entry = psychMap.get(normalized)!;
    entry.total++;
    if (parseAgendamento(c.feedback_ia)) entry.convertidos++;
  });
  const psychData: PsychStateData[] = Array.from(psychMap.entries())
    .map(([estado, vals]) => ({
      estado,
      total: vals.total,
      convertidos: vals.convertidos,
      taxa: vals.total > 0 ? Math.round((vals.convertidos / vals.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // RAPOVECA mal gerida
  const totalComFeedback = chamadasComFeedback.length;
  const totalMalGerida = chamadasComFeedback.filter((c) => parseRapovecaMalGerida(c.feedback_ia)).length;
  const indiceRapovecaMalGerida = totalComFeedback > 0
    ? Math.round((totalMalGerida / totalComFeedback) * 100)
    : 0;

  return {
    sdrStats,
    totalGeral,
    totalFinalizadas,
    totalNaoAtendidas,
    duracaoMediaGeral,
    notaMediaGeral,
    taxaContatoGeral,
    taxaAgendamento,
    hourlyData,
    dailyData,
    psychData,
    indiceRapovecaMalGerida,
    totalMalGerida,
    totalComFeedback,
  };
}

export function useRadarOutbound() {
  return useQuery({
    queryKey: ["radar-outbound"],
    queryFn: async () => {
      const [chamadasRes, profilesRes, leadsRes, funisRes] = await Promise.all([
        supabase.from("crm_chamadas").select("id, user_id, lead_id, status, duracao_segundos, nota_ia, created_at, canal, feedback_ia"),
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
