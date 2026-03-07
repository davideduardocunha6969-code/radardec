import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import type { ProfileHistory } from "@/hooks/useRadarViralizacao";

export interface OwnProfile {
  id: string;
  user_id: string;
  username: string;
  platform: string;
  display_name: string | null;
  followers_count: number | null;
  following_count: number | null;
  posts_count: number | null;
  avatar_url: string | null;
  biography: string | null;
  is_business: boolean | null;
  is_verified: boolean | null;
  external_url: string | null;
  date_joined: string | null;
  avg_likes_recent: number | null;
  avg_views_recent: number | null;
  avg_comments_recent: number | null;
  avg_shares_recent: number | null;
  engagement_rate: number | null;
  top_posts: unknown[] | null;
  is_own_account: boolean;
  is_active: boolean | null;
  last_scanned_at: string | null;
  created_at: string | null;
  legal_area: string | null;
}

export function useMinhasContas() {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  const { data: ownProfiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["monitored_profiles", "own"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("monitored_profiles")
        .select("*")
        .eq("user_id", userData.user.id)
        .eq("is_own_account", true)
        .order("followers_count", { ascending: false });
      if (error) throw error;
      const raw = data as Record<string, unknown>[];
      return raw.map(p => ({
        ...p,
        engagement_rate: p.engagement_rate ?? p.engagement_score_7d ?? null,
      })) as unknown as OwnProfile[];
    },
  });

  const instagramProfiles = useMemo(() => ownProfiles.filter((p) => p.platform === "instagram"), [ownProfiles]);
  const tiktokProfiles = useMemo(() => ownProfiles.filter((p) => p.platform === "tiktok"), [ownProfiles]);
  const facebookProfiles = useMemo(() => ownProfiles.filter((p) => p.platform === "facebook"), [ownProfiles]);

  const scanProfile = async (profileId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Não autenticado");
    const toastId = toast.loading("Escaneando perfil…");
    try {
      const { data, error } = await supabase.functions.invoke("profile-deep-scan", {
        body: { user_id: userData.user.id, profile_id: profileId },
      });
      if (error) throw error;
      toast.success("Scan concluído!", { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["monitored_profiles"] });
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro no scan: " + msg, { id: toastId });
      throw e;
    }
  };

  const scanAllByPlatform = async (platform: string) => {
    const profiles = ownProfiles.filter((p) => p.platform === platform);
    if (profiles.length === 0) {
      toast.info("Nenhum perfil cadastrado para essa plataforma");
      return;
    }
    setIsScanning(true);
    const toastId = toast.loading(`Escaneando ${profiles.length} perfil(is) de ${platform}…`);
    try {
      for (let i = 0; i < profiles.length; i++) {
        await scanProfile(profiles[i].id);
        if (i < profiles.length - 1) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      toast.success("Todos os perfis atualizados!", { id: toastId });
    } catch {
      toast.error("Scan interrompido por erro", { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  const markAsOwn = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("monitored_profiles")
        .update({ is_own_account: true } as never)
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_profiles"] });
      toast.success("Perfil marcado como conta própria");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateLegalArea = useMutation({
    mutationFn: async ({ id, legal_area }: { id: string; legal_area: string | null }) => {
      const { error } = await supabase
        .from("monitored_profiles")
        .update({ legal_area } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_profiles"] });
      toast.success("Ramo do direito atualizado");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const fetchHistory = async (profileId: string): Promise<ProfileHistory[]> => {
    const { data, error } = await supabase
      .from("profile_history")
      .select("*")
      .eq("profile_id", profileId)
      .order("recorded_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ProfileHistory[];
  };

  return {
    ownProfiles,
    instagramProfiles,
    tiktokProfiles,
    facebookProfiles,
    loadingProfiles,
    isScanning,
    scanProfile,
    scanAllByPlatform,
    markAsOwn,
    updateLegalArea,
    fetchHistory,
  };
}
