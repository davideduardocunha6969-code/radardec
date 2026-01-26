import { useState, useEffect } from "react";
import { Loader2, Save, Building2, Target, Award, History, Heart, Briefcase } from "lucide-react";
import { useIaEscritorio } from "@/hooks/useIaEscritorio";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function EscritorioSection() {
  const { escritorio, isLoading, updateEscritorio } = useIaEscritorio();
  
  const [formData, setFormData] = useState({
    sobre: "",
    areas_atuacao: "",
    diferenciais: "",
    metas_ano: "",
    valores: "",
    historico: "",
  });

  useEffect(() => {
    if (escritorio) {
      setFormData({
        sobre: escritorio.sobre || "",
        areas_atuacao: escritorio.areas_atuacao || "",
        diferenciais: escritorio.diferenciais || "",
        metas_ano: escritorio.metas_ano || "",
        valores: escritorio.valores || "",
        historico: escritorio.historico || "",
      });
    }
  }, [escritorio]);

  const handleSave = () => {
    updateEscritorio.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const sections = [
    {
      id: "sobre",
      icon: Building2,
      title: "Sobre o Escritório",
      description: "Descreva o escritório, sua missão, visão e propósito",
      placeholder: "Ex: Somos um escritório de advocacia especializado em...",
      field: "sobre" as const,
    },
    {
      id: "areas",
      icon: Briefcase,
      title: "Áreas de Atuação",
      description: "Liste as áreas de especialidade do escritório",
      placeholder: "Ex: Direito Previdenciário, Direito Trabalhista, Direito Bancário...",
      field: "areas_atuacao" as const,
    },
    {
      id: "diferenciais",
      icon: Award,
      title: "Diferenciais",
      description: "O que diferencia o escritório da concorrência",
      placeholder: "Ex: Atendimento personalizado, tecnologia de ponta, equipe especializada...",
      field: "diferenciais" as const,
    },
    {
      id: "metas",
      icon: Target,
      title: "Metas do Ano",
      description: "Objetivos e metas para o ano corrente",
      placeholder: "Ex: Aumentar captação em 20%, expandir equipe do previdenciário, implementar novo CRM...",
      field: "metas_ano" as const,
    },
    {
      id: "valores",
      icon: Heart,
      title: "Valores",
      description: "Princípios e valores que guiam o escritório",
      placeholder: "Ex: Ética, transparência, excelência, compromisso com o cliente...",
      field: "valores" as const,
    },
    {
      id: "historico",
      icon: History,
      title: "Histórico",
      description: "Breve história do escritório e marcos importantes",
      placeholder: "Ex: Fundado em 2010, o escritório começou focado em...",
      field: "historico" as const,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Informações do Escritório</h3>
          <p className="text-sm text-muted-foreground">
            Documente informações sobre o escritório para contextualizar a IA
          </p>
        </div>
        <Button onClick={handleSave} disabled={updateEscritorio.isPending}>
          {updateEscritorio.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={["sobre", "areas", "metas"]} className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          const hasContent = formData[section.field]?.trim().length > 0;
          
          return (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${hasContent ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`h-4 w-4 ${hasContent ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{section.title}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  {hasContent && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                      Preenchido
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <Textarea
                  value={formData[section.field]}
                  onChange={(e) => setFormData({ ...formData, [section.field]: e.target.value })}
                  placeholder={section.placeholder}
                  className="min-h-[150px] font-mono text-sm"
                />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Building2 className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Dica</p>
              <p className="text-sm text-muted-foreground mt-1">
                Quanto mais detalhadas forem as informações sobre o escritório, melhor a IA poderá 
                contextualizar suas respostas e fornecer análises alinhadas com os objetivos e a 
                cultura organizacional.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
