import { useState, useEffect } from "react";
import { Loader2, Save, Bot, Brain, MessageSquare, Shield, Target } from "lucide-react";
import { useIaProfile } from "@/hooks/useIaProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PerfilIA = () => {
  const { profile, isLoading, updateProfile } = useIaProfile();
  
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    persona: "",
    forma_pensar: "",
    formato_resposta: "",
    regras: "",
    postura: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        nome: profile.nome || "",
        descricao: profile.descricao || "",
        persona: profile.persona || "",
        forma_pensar: profile.forma_pensar || "",
        formato_resposta: profile.formato_resposta || "",
        regras: profile.regras || "",
        postura: profile.postura || "",
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (!profile) return;
    updateProfile.mutate({
      id: profile.id,
      ...formData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-display">
                Perfil IA.DEC
              </h1>
              <p className="text-muted-foreground">
                Configure a persona e comportamento da IA para análise de gestão
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Target className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Objetivo Central</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Transformar dados operacionais em decisões estratégicas claras, práticas e acionáveis, 
                  sempre buscando aumento de produtividade, redução de gargalos, melhor uso do tempo 
                  da equipe, escalabilidade do escritório e clareza gerencial para tomada de decisão.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Identificação
            </CardTitle>
            <CardDescription>
              Nome e descrição do perfil da IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Perfil</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: IA.DEC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Breve descrição do perfil"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="persona" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="persona" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Persona</span>
            </TabsTrigger>
            <TabsTrigger value="pensamento" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Pensamento</span>
            </TabsTrigger>
            <TabsTrigger value="formato" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Formato</span>
            </TabsTrigger>
            <TabsTrigger value="regras" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Regras</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="persona">
            <Card>
              <CardHeader>
                <CardTitle>Persona & Papel</CardTitle>
                <CardDescription>
                  Define quem é a IA e qual seu papel no escritório
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.persona}
                  onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                  placeholder="Descreva a persona da IA..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pensamento">
            <Card>
              <CardHeader>
                <CardTitle>Forma de Pensar</CardTitle>
                <CardDescription>
                  Define a ordem lógica de raciocínio que a IA deve seguir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.forma_pensar}
                  onChange={(e) => setFormData({ ...formData, forma_pensar: e.target.value })}
                  placeholder="Descreva a forma de pensar..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="formato">
            <Card>
              <CardHeader>
                <CardTitle>Formato das Respostas</CardTitle>
                <CardDescription>
                  Define a estrutura padrão que a IA deve usar nas respostas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.formato_resposta}
                  onChange={(e) => setFormData({ ...formData, formato_resposta: e.target.value })}
                  placeholder="Descreva o formato das respostas..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="regras">
            <Card>
              <CardHeader>
                <CardTitle>Regras & Postura</CardTitle>
                <CardDescription>
                  Define regras importantes e a postura que a IA deve adotar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Regras Importantes</Label>
                  <Textarea
                    value={formData.regras}
                    onChange={(e) => setFormData({ ...formData, regras: e.target.value })}
                    placeholder="Descreva as regras..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Postura</Label>
                  <Textarea
                    value={formData.postura}
                    onChange={(e) => setFormData({ ...formData, postura: e.target.value })}
                    placeholder="Descreva a postura..."
                    className="min-h-[150px] font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PerfilIA;
