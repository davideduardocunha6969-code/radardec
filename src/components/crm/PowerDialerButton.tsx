import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog";
import { PhoneCall, Loader2, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { Device } from "@twilio/voice-sdk";

interface PowerDialerButtonProps {
  funilId: string;
  colunaId: string;
  leadsCount: number;
}

export function PowerDialerButton({ funilId, colunaId, leadsCount }: PowerDialerButtonProps) {
  const { user } = useAuthContext();
  const [roleDialog, setRoleDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [missedAlert, setMissedAlert] = useState<{ leadNome: string; leadId: string; numero: string; papel: string } | null>(null);
  const windowRef = useRef<Window | null>(null);
  const deviceRef = useRef<Device | null>(null);

  // Initialize Twilio Device on mount (standby)
  useEffect(() => {
    if (!user) return;

    const initDevice = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("twilio-token");
        if (error || !data?.token) return;

        const device = new Device(data.token, {
          logLevel: 1,
        });

        device.on("incoming", (call) => {
          console.log("[PowerDialer] Incoming call, auto-accepting");
          call.accept();
        });

        await device.register();
        deviceRef.current = device;
        console.log("[PowerDialer] Device registered in standby");
      } catch (e) {
        console.error("[PowerDialer] Device init error:", e);
      }
    };

    initDevice();

    return () => {
      deviceRef.current?.destroy();
      deviceRef.current = null;
    };
  }, [user]);

  // Subscribe to session Realtime when active
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
            // Lead answered!
            const redirectUrl = `/atendimento?leadId=${sess.lead_atendido_id}&numero=${encodeURIComponent(sess.telefone_atendido || "")}&tipo=voip&funilId=${sess.funil_id}&papel=${sess.papel}`;

            if (windowRef.current && !windowRef.current.closed) {
              windowRef.current.location.href = redirectUrl;
            } else {
              // Window was closed — show inline alert
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

          // Check if all calls in batch are done (no em_andamento left)
          const resultados = sess.resultado_por_numero as Record<string, string> || {};
          const leadsInfo = sess.leads_info as Array<{ numero: string }> || [];
          const allDone = leadsInfo.length > 0 && leadsInfo.every(
            (li) => resultados[li.numero] && !["em_andamento", "em_chamada"].includes(resultados[li.numero])
          );

          if (allDone && sess.status === "ativo") {
            // Auto next-batch
            console.log("[PowerDialer] Batch done, calling next-batch");
            supabase.functions.invoke("power-dialer", {
              body: { action: "next-batch", sessionId: activeSessionId },
            }).catch((e) => console.error("[PowerDialer] next-batch error:", e));
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
                    `/atendimento?leadId=${missedAlert.leadId}&numero=${encodeURIComponent(missedAlert.numero)}&tipo=voip&funilId=${funilId}&papel=${(missedAlert as any).papel || "sdr"}`,
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
