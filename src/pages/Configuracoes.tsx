import { useState } from "react";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadSecoesConfig } from "@/components/configuracoes/LeadSecoesConfig";

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
        </TabsList>

        <TabsContent value="lead-dados" className="mt-4">
          <LeadSecoesConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
