import { useState } from "react";
import { FileSpreadsheet, Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SheetInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

const SheetInput = ({ onSubmit, isLoading = false, className }: SheetInputProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-card p-8 shadow-card transition-all duration-300",
        className
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-card-foreground">
            Conectar Planilha
          </h2>
          <p className="text-sm text-muted-foreground">
            Cole a URL do seu Google Sheets para começar a análise
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Link className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-14 pl-12 text-base"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 text-base font-medium gradient-primary border-0 hover:opacity-90 transition-opacity"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-5 w-5" />
              Analisar Planilha
            </>
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Certifique-se de que a planilha está compartilhada como "Qualquer pessoa com o link"
      </p>
    </div>
  );
};

export default SheetInput;
