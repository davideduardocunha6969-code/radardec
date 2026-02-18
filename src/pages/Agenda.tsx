import { Calendar } from "lucide-react";

export default function Agenda() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground">Gerencie seus compromissos e veja a disponibilidade da equipe.</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/30">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Agenda em construção</p>
        <p className="text-sm text-muted-foreground mt-1">Em breve você poderá cadastrar eventos e consultar disponibilidade.</p>
      </div>
    </div>
  );
}
