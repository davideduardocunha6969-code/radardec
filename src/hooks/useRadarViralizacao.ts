import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export interface MonitoredProfile {
  id: string;
  user_id: string;
  username: string;
  platform: "instagram" | "tiktok" | "facebook";
  display_name: string | null;
  followers_count: number | null;
  avatar_url: string | null;
  is_active: boolean;
  last_scanned_at: string | null;
  created_at: string;
  posts_count: number | null;
  avg_posts_per_day: number | null;
  avg_posts_per_week: number | null;
  avg_posts_per_month: number | null;
  engagement_score_7d: number | null;
  is_own_account: boolean;
  following_count: number | null;
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
  top_posts: any[] | null;
}

export interface ProfileHistory {
  id: string;
  profile_id: string;
  user_id: string;
  followers_count: number | null;
  posts_count: number | null;
  avg_views_7d: number | null;
  avg_likes_7d: number | null;
  engagement_score: number | null;
  recorded_at: string;
}

export interface MonitoredTopic {
  id: string;
  user_id: string;
  topic: string;
  platform: "instagram" | "tiktok" | "ambos";
  is_active: boolean;
  last_scanned_at: string | null;
  created_at: string;
}

export interface ViralContent {
  id: string;
  user_id: string;
  source_type: string;
  source_id: string | null;
  platform: string;
  username: string | null;
  post_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  followers_at_capture: number | null;
  virality_rate: number | null;
  is_modeled: boolean;
  modeled_at: string | null;
  detected_at: string;
  scan_week: string | null;
}

export function useRadarViralizacao() {
  const queryClient = useQueryClient();
  const [isScanning, setIsScanning] = useState(false);

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ["monitored_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitored_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MonitoredProfile[];
    },
  });

  const { data: topics = [], isLoading: loadingTopics } = useQuery({
    queryKey: ["monitored_topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monitored_topics")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MonitoredTopic[];
    },
  });

  const { data: viralContent = [], isLoading: loadingVirals } = useQuery({
    queryKey: ["viral_content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viral_content")
        .select("*")
        .eq("is_dismissed", false)
        .order("detected_at", { ascending: false });
      if (error) throw error;
      return data as ViralContent[];
    },
  });

  const addProfile = useMutation({
    mutationFn: async (input: { username: string; platform: "instagram" | "tiktok" }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("monitored_profiles").insert({
        user_id: userData.user.id,
        username: input.username,
        platform: input.platform,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_profiles"] });
      toast.success("Perfil adicionado!");
    },
    onError: (e) => toast.error("Erro ao adicionar perfil: " + e.message),
  });

  const removeProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monitored_profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_profiles"] });
      toast.success("Perfil removido!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const toggleProfile = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("monitored_profiles").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitored_profiles"] }),
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const addTopic = useMutation({
    mutationFn: async (input: { topic: string; platform: "instagram" | "tiktok" | "ambos" }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");
      const { error } = await supabase.from("monitored_topics").insert({
        user_id: userData.user.id,
        topic: input.topic,
        platform: input.platform,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_topics"] });
      toast.success("Tema adicionado!");
    },
    onError: (e) => toast.error("Erro ao adicionar tema: " + e.message),
  });

  const removeTopic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monitored_topics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored_topics"] });
      toast.success("Tema removido!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const toggleTopic = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("monitored_topics").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["monitored_topics"] }),
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const runScan = async (scanType: "profiles" | "topics" | "all") => {
    setIsScanning(true);
    const toastId = toast.loading("Escaneando… isso pode levar alguns minutos");
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Não autenticado");
      const { data, error } = await supabase.functions.invoke("radar-scan", {
        body: { scan_type: scanType, user_id: userData.user.id },
      });
      if (error) throw error;
      toast.success(`Scan concluído! ${data?.found ?? 0} virais encontrados.`, { id: toastId });
      queryClient.invalidateQueries({ queryKey: ["viral_content"] });
      queryClient.invalidateQueries({ queryKey: ["monitored_profiles"] });
      queryClient.invalidateQueries({ queryKey: ["monitored_topics"] });
    } catch (e: any) {
      toast.error("Erro no scan: " + (e.message || "Erro desconhecido"), { id: toastId });
    } finally {
      setIsScanning(false);
    }
  };

  const markAsModeled = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("viral_content")
        .update({ is_modeled: true, modeled_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral_content"] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const fetchProfileHistory = async (profileId: string): Promise<ProfileHistory[]> => {
    const { data, error } = await supabase
      .from("profile_history")
      .select("*")
      .eq("profile_id", profileId)
      .order("recorded_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as ProfileHistory[];
  };

  const dismissViral = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("viral_content")
        .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral_content"] });
      toast.success("Viral desconsiderado");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  return {
    profiles,
    topics,
    viralContent,
    isScanning,
    loadingProfiles,
    loadingTopics,
    loadingVirals,
    addProfile,
    removeProfile,
    toggleProfile,
    addTopic,
    removeTopic,
    toggleTopic,
    runScan,
    markAsModeled,
    dismissViral,
    fetchProfileHistory,
  };
}
