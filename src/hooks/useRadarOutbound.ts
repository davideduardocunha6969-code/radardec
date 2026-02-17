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

export function useRadarOutbound() {
  return useQuery({
    queryKey: ["radar-outbound"],
    queryFn: async () => {
      // Fetch all chamadas with profile info
      const { data: chamadas, error: chamError } = await supabase
        .from("crm_chamadas")
        .select("id, user_id, status, duracao_segundos, nota_ia, created_at, canal");

      if (chamError) throw chamError;

      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("user_id, display_name");

      if (profError) throw profError;

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) || []);

      // Group by user
      const grouped = new Map<string, typeof chamadas>();
      (chamadas || []).forEach((c) => {
        if (!grouped.has(c.user_id)) grouped.set(c.user_id, []);
        grouped.get(c.user_id)!.push(c);
      });

      const stats: SdrStats[] = Array.from(grouped.entries()).map(([userId, calls]) => {
        const finalizadas = calls.filter((c) => c.status === "finalizada").length;
        const naoAtendidas = calls.filter((c) => c.status === "nao_atendida").length;
        const atendidas = finalizadas; // finalizada = atendida e concluída

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
          atendidas,
          naoAtendidas,
          finalizadas,
          duracaoMediaSegundos: duracaoMedia,
          notaMedia,
        };
      });

      // Sort by total calls desc
      stats.sort((a, b) => b.totalChamadas - a.totalChamadas);

      // Global stats
      const allCalls = chamadas || [];
      const totalGeral = allCalls.length;
      const totalFinalizadas = allCalls.filter((c) => c.status === "finalizada").length;
      const totalNaoAtendidas = allCalls.filter((c) => c.status === "nao_atendida").length;
      const allDuracoes = allCalls
        .map((c) => c.duracao_segundos)
        .filter((d): d is number => d != null && d > 0);
      const duracaoMediaGeral = allDuracoes.length
        ? Math.round(allDuracoes.reduce((a, b) => a + b, 0) / allDuracoes.length)
        : 0;
      const allNotas = allCalls
        .map((c) => c.nota_ia)
        .filter((n): n is number => n != null);
      const notaMediaGeral = allNotas.length
        ? Math.round((allNotas.reduce((a, b) => a + b, 0) / allNotas.length) * 10) / 10
        : null;

      return {
        sdrStats: stats,
        totalGeral,
        totalFinalizadas,
        totalNaoAtendidas,
        duracaoMediaGeral,
        notaMediaGeral,
      };
    },
  });
}
