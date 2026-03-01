import { useState } from "react";
import { Settings, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadSecoesConfig } from "@/components/configuracoes/LeadSecoesConfig";
import { useTwilioNumeros, useCreateTwilioNumero, useToggleTwilioNumero, useDeleteTwilioNumero } from "@/hooks/useTwilioNumeros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

function NumerosVoipTab() {
  const { data: numeros, isLoading } = useTwilioNumeros();
  const createNumero = useCreateTwilioNumero();
  const toggleNumero = useToggleTwilioNumero();
  const deleteNumero = useDeleteTwilioNumero();
  const [form, setForm] = useState({ numero: "", ddd: "", regiao: "" });
  const [syncing, setSyncing] = useState(false);
  const qc = useQueryClient();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-twilio-numeros");
      if (error) throw error;
      toast.success(`${data.importados} números importados, ${data.existentes} já existiam`);
      qc.invalidateQueries({ queryKey: ["twilio_numeros"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao importar números");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreate = () => {
    if (!form.numero || !form.ddd) {
      toast.error("Número e DDD são obrigatórios");
      return;
    }
    createNumero.mutate({ numero: form.numero, ddd: form.ddd, regiao: form.regiao || undefined }, {
      onSuccess: () => setForm({ numero: "", ddd: "", regiao: "" }),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Números VoIP (Local Presence)</CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Cadastre números Twilio por DDD para aumentar a taxa de atendimento com Local Presence.
          </p>
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />
            Importar do Twilio
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium">Número (E.164)</label>
            <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="+5511999999999" />
          </div>
          <div className="w-20">
            <label className="text-xs font-medium">DDD</label>
            <Input value={form.ddd} onChange={(e) => setForm({ ...form, ddd: e.target.value })} placeholder="11" />
          </div>
          <div className="w-36">
            <label className="text-xs font-medium">Região</label>
            <Input value={form.regiao} onChange={(e) => setForm({ ...form, regiao: e.target.value })} placeholder="São Paulo" />
          </div>
          <Button onClick={handleCreate} disabled={createNumero.isPending} size="sm">
            <Plus className="h-4 w-4 mr-1" />Adicionar
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : !numeros?.length ? (
          <p className="text-sm text-muted-foreground">Nenhum número cadastrado</p>
        ) : (
          <div className="space-y-2">
            {numeros.map((n) => (
              <div key={n.id} className="flex items-center justify-between py-2 px-3 rounded border">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{n.numero}</span>
                  <Badge variant="secondary">DDD {n.ddd}</Badge>
                  {n.regiao && <span className="text-sm text-muted-foreground">{n.regiao}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleNumero.mutate({ id: n.id, ativo: !n.ativo })}
                    title={n.ativo ? "Desativar" : "Ativar"}
                  >
                    {n.ativo ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteNumero.mutate(n.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Tabs defaultValue="lead-dados" className="w-full">
        <TabsList>
          <TabsTrigger value="lead-dados">Dados do Lead</TabsTrigger>
          <TabsTrigger value="numeros-voip">Números VoIP</TabsTrigger>
        </TabsList>

        <TabsContent value="lead-dados" className="mt-4">
          <LeadSecoesConfig />
        </TabsContent>

        <TabsContent value="numeros-voip" className="mt-4">
          <NumerosVoipTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
