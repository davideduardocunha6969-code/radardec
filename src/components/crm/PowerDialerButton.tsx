import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { PhoneCall, Loader2, PhoneOff } from "lucide-react";
import { toast } from "sonner";

interface PowerDialerButtonProps {
  funilId: string;
  colunaId: string;
  leadsCount: number;
}

export function PowerDialerButton({ funilId, colunaId, leadsCount }: PowerDialerButtonProps) {
  const [roleDialog, setRoleDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [missedAlert, setMissedAlert] = useState<{ leadNome: string; leadId: string; numero: string; papel: string } | null>(null);
  const windowRef = useRef<Window | null>(null);

  // NO Twilio Device here — Device lives in AtendimentoAguardando

  // Subscribe to session Realtime when active — only for cancel button state + missed alert
  useEffect(() => {
    if (!activeSessionId) return;

    const channel = supabase
      .channel(`pd-btn-${activeSessionId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "power_dialer_sessions",
          filter: `id=eq.${activeSessionId}`,
        },
        (payload: any) => {
          const sess = payload.new;

          if (sess.lead_atendido_id) {
            // Lead answered — AtendimentoAguardando handles audio + opening atendimento
            // Just check if window was closed (missed alert)
            if (!windowRef.current || windowRef.current.closed) {
              const info = (sess.leads_info as any[])?.find((l: any) => l.leadId === sess.lead_atendido_id);
              setMissedAlert({
                leadNome: info?.leadNome || "Lead",
                leadId: sess.lead_atendido_id,
                numero: sess.telefone_atendido || "",
                papel: sess.papel || "sdr",
              });
            }
            setActiveSessionId(null);
            return;
          }

          if (sess.status === "finalizado_sem_atendimento" || sess.status === "cancelado" || sess.status === "expirado") {
            setActiveSessionId(null);
            if (sess.status === "finalizado_sem_atendimento") {
              toast.info("Nenhum lead atendeu nesta coluna");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  const startDialer = async (papel: string) => {
    setRoleDialog(false);
    setLoading(true);

    try {
      // Open window SYNCHRONOUSLY before await
      const janela = window.open(
        "/atendimento-aguardando?status=iniciando",
        `power_dialer_${colunaId}`,
        "width=520,height=600,menubar=no,toolbar=no,location=no,status=no"
      );
      windowRef.current = janela;

      const { data, error } = await supabase.functions.invoke("power-dialer", {
        body: { action: "start", funilId, colunaId, papel },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const sessionId = data.sessionId;
      setActiveSessionId(sessionId);

      // Redirect the waiting window to show session info
      if (janela && !janela.closed) {
        janela.location.href = `/atendimento-aguardando?sessionId=${sessionId}`;
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao iniciar Power Dialer");
      if (windowRef.current && !windowRef.current.closed) {
        windowRef.current.close();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeSessionId) return;
    setCancelling(true);
    try {
      await supabase.functions.invoke("power-dialer", {
        body: { action: "cancel", sessionId: activeSessionId },
      });
      setActiveSessionId(null);
    } catch (e) {
      console.error("Cancel error:", e);
    }
    setCancelling(false);
  };

  if (leadsCount === 0) return null;

  return (
    <>
      {activeSessionId ? (
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7"
          onClick={handleCancel}
          disabled={cancelling}
          title="Cancelar Power Dialer"
        >
          {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneOff className="h-3.5 w-3.5" />}
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setRoleDialog(true)}
          disabled={loading}
          title="Power Dialer"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneCall className="h-3.5 w-3.5" />}
        </Button>
      )}

      {/* Role selection dialog */}
      <Dialog open={roleDialog} onOpenChange={setRoleDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Power Dialer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Discar para {leadsCount} leads nesta coluna. Selecione o papel:
          </p>
          <DialogFooter className="flex gap-2 sm:justify-center">
            <Button onClick={() => startDialer("sdr")}>SDR</Button>
            <Button variant="outline" onClick={() => startDialer("closer")}>Closer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Missed call alert (window was closed) */}
      <AlertDialog open={!!missedAlert} onOpenChange={(o) => !o && setMissedAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🔔 {missedAlert?.leadNome} atendeu!</AlertDialogTitle>
            <AlertDialogDescription>
              A janela de aguardo foi fechada, mas o lead atendeu a chamada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (missedAlert) {
                  window.open(
                    `/atendimento?leadId=${missedAlert.leadId}&numero=${encodeURIComponent(missedAlert.numero)}&tipo=voip&funilId=${funilId}&papel=${missedAlert.papel}`,
                    `atendimento_${missedAlert.leadId}`,
                    "width=1200,height=800"
                  );
                }
                setMissedAlert(null);
              }}
            >
              Abrir Atendimento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
