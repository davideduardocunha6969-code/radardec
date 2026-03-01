import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Phone, PhoneOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface LeadInfo {
  leadId: string;
  leadNome: string;
  numero: string;
  status: string;
}

export default function AtendimentoAguardando() {
  const [params] = useSearchParams();
  const sessionId = params.get("sessionId");
  const status = params.get("status");

  const [session, setSession] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  // Initial fetch
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      const { data, error } = await (supabase
        .from("power_dialer_sessions" as any)
        .select("*")
        .eq("id", sessionId)
        .single() as any);
      if (error) console.error("Fetch session error:", error);
      if (data) setSession(data);
    };
    fetchSession();
  }, [sessionId]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`pds-${sessionId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "power_dialer_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload: any) => {
          setSession(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Redirect when lead is answered
  useEffect(() => {
    if (!session?.lead_atendido_id) return;

    const redirectUrl = `/atendimento?leadId=${session.lead_atendido_id}&numero=${encodeURIComponent(session.telefone_atendido || "")}&tipo=voip&funilId=${session.funil_id}&papel=${session.papel}`;
    window.location.href = redirectUrl;
  }, [session?.lead_atendido_id]);

  const handleCancel = async () => {
    if (!sessionId) return;
    setCancelling(true);
    try {
      const { error } = await supabase.functions.invoke("power-dialer", {
        body: { action: "cancel", sessionId },
      });
      if (error) {
        toast.error("Erro ao cancelar discagem");
        console.error("Cancel error:", error);
      }
    } catch (e) {
      toast.error("Erro ao cancelar discagem");
      console.error("Cancel error:", e);
    }
    setCancelling(false);
  };

  const leadsInfo = (session?.leads_info || []) as LeadInfo[];
  const queue = (session?.numeros_fila || []) as any[];
  const totalLeads = queue.length;
  const loteAtual = session?.lote_atual || 0;
  const loteMax = Math.ceil(totalLeads / 5);
  const progressPercent = loteMax > 0 ? ((loteAtual + 1) / loteMax) * 100 : 0;

  const isFinished = session?.status === "finalizado_sem_atendimento" || session?.status === "cancelado" || session?.status === "expirado";

  if (status === "iniciando" && !sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Iniciando Power Dialer...</p>
            <p className="text-sm text-muted-foreground">Preparando as chamadas</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[480px]">
        <CardContent className="py-8 space-y-6">
          {isFinished ? (
            <div className="flex flex-col items-center gap-4">
              <PhoneOff className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">
                {session?.status === "cancelado" ? "Discagem cancelada" : "Nenhum lead atendeu"}
              </p>
              <Button variant="outline" onClick={() => window.close()}>Fechar</Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Phone className="h-10 w-10 text-primary" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                </div>
                <p className="text-lg font-semibold">Discando...</p>
                <p className="text-sm text-muted-foreground">
                  Lote {loteAtual + 1} de {loteMax} • {totalLeads} leads na fila
                </p>
              </div>

              <Progress value={progressPercent} className="h-2" />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">Lote atual</p>
                {leadsInfo.map((li, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/50">
                    <span className="font-medium">{li.leadNome}</span>
                    <span className="text-xs text-muted-foreground">{li.numero}</span>
                  </div>
                ))}
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PhoneOff className="h-4 w-4 mr-2" />}
                Cancelar Discagem
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
