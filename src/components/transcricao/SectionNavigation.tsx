import { useState, useEffect } from "react";
import { FileText, Sparkles, MessageSquare, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SectionNavigationProps {
  showTranscription: boolean;
  analysisCount: number;
}

export function SectionNavigation({ 
  showTranscription, 
  analysisCount 
}: SectionNavigationProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);

  const navItems: NavItem[] = [
    { id: "segmentos", label: "Segmentos", icon: <MessageSquare className="h-4 w-4" /> },
  ];

  if (showTranscription) {
    navItems.push(
      { id: "transcricao-completa", label: "Transcrição", icon: <FileText className="h-4 w-4" /> },
      { id: "prompts-ia", label: "Prompts IA", icon: <Sparkles className="h-4 w-4" /> }
    );
  }

  // Add analysis results to navigation
  for (let i = 0; i < analysisCount; i++) {
    navItems.push({
      id: `analise-${i}`,
      label: `Análise ${i + 1}`,
      icon: <Sparkles className="h-4 w-4" />,
    });
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('[data-scroll-container="transcricao"]');
      if (!scrollContainer) return;

      const scrollTop = scrollContainer.scrollTop;
      setShowBackToTop(scrollTop > 300);

      // Find which section is currently in view
      const sections = navItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id),
      })).filter(s => s.element);

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          if (rect.top <= containerRect.top + 150) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    const scrollContainer = document.querySelector('[data-scroll-container="transcricao"]');
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [navItems.length]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    const scrollContainer = document.querySelector('[data-scroll-container="transcricao"]');
    
    if (element && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const offset = elementRect.top - containerRect.top + scrollContainer.scrollTop - 20;
      
      scrollContainer.scrollTo({
        top: offset,
        behavior: "smooth",
      });
    }
  };

  const scrollToTop = () => {
    const scrollContainer = document.querySelector('[data-scroll-container="transcricao"]');
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  if (navItems.length <= 1) return null;

  return (
    <>
      {/* Fixed Navigation Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-4 -mx-6 px-6 py-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground mr-2 shrink-0">Ir para:</span>
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              size="sm"
              onClick={() => scrollToSection(item.id)}
              className={cn(
                "gap-1.5 shrink-0 text-xs h-8",
                activeSection === item.id && "bg-primary/10 text-primary"
              )}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full shadow-lg"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      )}
    </>
  );
}
