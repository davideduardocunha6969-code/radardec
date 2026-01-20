import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  useConteudosMidia,
  ConteudoMidia,
  ConteudoMidiaInput,
  Setor,
  Formato,
  Status,
} from "@/hooks/useConteudosMidia";
import { ConteudoFormDialog } from "@/components/midia/ConteudoFormDialog";
import { ConteudoDetailDialog } from "@/components/midia/ConteudoDetailDialog";
import { ConteudoStatsSection } from "@/components/midia/ConteudoStatsSection";
import { ConteudoFilters } from "@/components/midia/ConteudoFilters";
import { ConteudoList } from "@/components/midia/ConteudoList";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function MidiaSocial() {
  const { isAdmin } = useAuthContext();
  const {
    conteudos,
    isLoading,
    createConteudo,
    updateConteudo,
    deleteConteudo,
  } = useConteudosMidia();

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedConteudo, setSelectedConteudo] = useState<ConteudoMidia | null>(
    null
  );
  const [statsOpen, setStatsOpen] = useState(false);

  // Filters
  const [setorFilter, setSetorFilter] = useState<Setor | "all">("all");
  const [formatoFilter, setFormatoFilter] = useState<Formato | "all">("all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");

  const filteredConteudos = useMemo(() => {
    return conteudos.filter((c) => {
      if (setorFilter !== "all" && c.setor !== setorFilter) return false;
      if (formatoFilter !== "all" && c.formato !== formatoFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [conteudos, setorFilter, formatoFilter, statusFilter]);

  const handleCreateSubmit = (data: ConteudoMidiaInput) => {
    createConteudo.mutate(data, {
      onSuccess: () => setFormDialogOpen(false),
    });
  };

  const handleSelectConteudo = (conteudo: ConteudoMidia) => {
    setSelectedConteudo(conteudo);
    setDetailDialogOpen(true);
  };

  const handleUpdateConteudo = (data: Partial<ConteudoMidia>) => {
    if (!selectedConteudo) return;
    updateConteudo.mutate(
      { id: selectedConteudo.id, ...data },
      {
        onSuccess: () => setDetailDialogOpen(false),
      }
    );
  };

  const handleStatusChange = (id: string, status: Status) => {
    updateConteudo.mutate({ id, status });
  };

  const handleDeleteConteudo = () => {
    if (!selectedConteudo) return;
    deleteConteudo.mutate(selectedConteudo.id, {
      onSuccess: () => setDetailDialogOpen(false),
    });
  };

  const clearFilters = () => {
    setSetorFilter("all");
    setFormatoFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendário de Conteúdo</h1>
          <p className="text-muted-foreground">
            Planejamento e controle de conteúdo para redes sociais
          </p>
        </div>
        <Button onClick={() => setFormDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Conteúdo
        </Button>
      </div>

      {/* Stats Section */}
      <ConteudoStatsSection
        conteudos={conteudos}
        isOpen={statsOpen}
        onOpenChange={setStatsOpen}
      />

      {/* Filters */}
      <ConteudoFilters
        setorFilter={setorFilter}
        formatoFilter={formatoFilter}
        statusFilter={statusFilter}
        onSetorChange={setSetorFilter}
        onFormatoChange={setFormatoFilter}
        onStatusChange={setStatusFilter}
        onClearFilters={clearFilters}
      />

      {/* Content List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <ConteudoList
          conteudos={filteredConteudos}
          onSelectConteudo={handleSelectConteudo}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Form Dialog */}
      <ConteudoFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        onSubmit={handleCreateSubmit}
        isLoading={createConteudo.isPending}
      />

      {/* Detail Dialog */}
      {selectedConteudo && (
        <ConteudoDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          conteudo={selectedConteudo}
          onUpdate={handleUpdateConteudo}
          onDelete={handleDeleteConteudo}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
