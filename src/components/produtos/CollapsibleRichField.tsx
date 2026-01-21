import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Image, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CollapsibleRichFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  defaultExpanded?: boolean;
}

export function CollapsibleRichField({
  id,
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
  defaultExpanded = false,
}: CollapsibleRichFieldProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isUploading, setIsUploading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync content when value changes externally
  useEffect(() => {
    if (editorRef.current && readOnly) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, readOnly]);

  const handlePaste = async (e: React.ClipboardEvent) => {
    if (readOnly) return;

    const items = e.clipboardData.items;
    
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await uploadAndInsertImage(file);
        }
        return;
      }
    }
  };

  const uploadAndInsertImage = async (file: File) => {
    setIsUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      const fileName = `inline-images/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("tipos-produtos-anexos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("tipos-produtos-anexos")
        .getPublicUrl(fileName);

      // Insert image at cursor position
      const img = document.createElement("img");
      img.src = urlData.publicUrl;
      img.style.maxWidth = "100%";
      img.style.borderRadius = "8px";
      img.style.margin = "8px 0";
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else if (editorRef.current) {
        editorRef.current.appendChild(img);
      }

      handleContentChange();
      toast.success("Imagem inserida!");
    } catch (error: any) {
      toast.error("Erro ao inserir imagem: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContentChange = () => {
    if (editorRef.current && !readOnly) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      await uploadAndInsertImage(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const previewText = value
    ? value.replace(/<[^>]*>/g, "").substring(0, 100) + (value.length > 100 ? "..." : "")
    : placeholder || "Clique para expandir";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Recolher
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Expandir
            </>
          )}
        </Button>
      </div>

      {!isExpanded ? (
        <div
          onClick={() => setIsExpanded(true)}
          className={cn(
            "px-3 py-2 rounded-md border border-border bg-muted/30 cursor-pointer",
            "text-sm text-muted-foreground line-clamp-2 hover:bg-muted/50 transition-colors",
            !value && "italic"
          )}
        >
          {previewText}
        </div>
      ) : (
        <div className="space-y-2">
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImageButtonClick}
                disabled={isUploading}
                className="h-8"
              >
                <Image className="h-4 w-4 mr-1" />
                Inserir Imagem
              </Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clipboard className="h-3 w-3" />
                ou cole uma imagem (Ctrl+V)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
          
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            onInput={handleContentChange}
            onPaste={handlePaste}
            dangerouslySetInnerHTML={{ __html: value || "" }}
            className={cn(
              "min-h-[150px] max-h-[400px] overflow-y-auto",
              "px-3 py-2 rounded-md border border-border bg-background",
              "text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              "prose prose-sm dark:prose-invert max-w-none",
              "[&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-2",
              readOnly && "bg-muted/30 cursor-default",
              isUploading && "opacity-50 pointer-events-none"
            )}
            data-placeholder={placeholder}
          />
          
          {isUploading && (
            <div className="text-xs text-muted-foreground animate-pulse">
              Enviando imagem...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
