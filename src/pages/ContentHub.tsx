import { useState, useMemo } from "react";
import { Plus, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  useIdeiasConteudo,
  IdeiaConteudoInput,
  IdeiaConteudo,
  SituacaoIdeia,
} from "@/hooks/useIdeiasConteudo";
import { Setor, Formato } from "@/hooks/useConteudosMidia";
import { IdeiaFormDialog } from "@/components/contenthub/IdeiaFormDialog";
import { IdeiaDetailDialog } from "@/components/contenthub/IdeiaDetailDialog";
import { IdeiaFilters } from "@/components/contenthub/IdeiaFilters";
import { IdeiaList } from "@/components/contenthub/IdeiaList";
import { IdeiaStatsSection } from "@/components/contenthub/IdeiaStatsSection";

export default function ContentHub() {
  const { isAdmin, canValidateContent } = useAuthContext();
  const { ideias, isLoading, createIdeia, updateIdeia, deleteIdeia, validarIdeia } = useIdeiasConteudo();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedIdeia, setSelectedIdeia] = useState<IdeiaConteudo | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);

  // Filters
  const [setorFilter, setSetorFilter] = useState<Setor | "all">("all");
  const [formatoFilter, setFormatoFilter] = useState<Formato | "all">("all");
  const [situacaoFilter, setSituacaoFilter] = useState<SituacaoIdeia | "all">("all");

  const filteredIdeias = useMemo(() => {
    return ideias.filter((i) => {
      if (setorFilter !== "all" && i.setor !== setorFilter) return false;
      if (formatoFilter !== "all" && i.formato !== formatoFilter) return false;
      if (situacaoFilter !== "all") {
        const isValidado = i.validado;
        if (situacaoFilter === "validado" && !isValidado) return false;
        if (situacaoFilter === "pendente" && isValidado) return false;
      }
      return true;
    });
  }, [ideias, setorFilter, formatoFilter, situacaoFilter]);

  const handleCreateSubmit = (data: IdeiaConteudoInput) => {
    createIdeia.mutate(data, {
      onSuccess: () => setIsFormOpen(false),
    });
  };

  const handleUpdate = (data: Partial<IdeiaConteudoInput> & { id: string }) => {
    updateIdeia.mutate(data);
  };

  const handleDelete = (id: string) => {
    deleteIdeia.mutate(id);
  };

  const handleValidar = (ideia: IdeiaConteudo) => {
    validarIdeia.mutate(ideia);
  };

  const clearFilters = () => {
    setSetorFilter("all");
    setFormatoFilter("all");
    setSituacaoFilter("all");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Content Hub</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas ideias de conteúdo
            </p>
          </div>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Conteúdo
        </Button>
      </div>

      {/* Filters */}
      <IdeiaFilters
        setorFilter={setorFilter}
        formatoFilter={formatoFilter}
        situacaoFilter={situacaoFilter}
        onSetorChange={setSetorFilter}
        onFormatoChange={setFormatoFilter}
        onSituacaoChange={setSituacaoFilter}
        onClearFilters={clearFilters}
      />

      {/* Stats Section */}
      <IdeiaStatsSection
        ideias={ideias}
        isOpen={statsOpen}
        onOpenChange={setStatsOpen}
      />

      {/* List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Carregando ideias...
        </div>
      ) : (
        <IdeiaList
          ideias={filteredIdeias}
          onItemClick={(ideia) => {
            setSelectedIdeia(ideia);
            setIsDetailOpen(true);
          }}
          onValidar={handleValidar}
          canValidate={canValidateContent()}
        />
      )}

      {/* Dialogs */}
      <IdeiaFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateSubmit}
        isLoading={createIdeia.isPending}
      />

      <IdeiaDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        ideia={selectedIdeia}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isAdmin={isAdmin}
      />
    </div>
  );
}
