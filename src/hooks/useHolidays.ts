import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useHolidays() {
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHolidays = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("holidays")
        .select("date")
        .order("date", { ascending: true });

      if (error) throw error;

      const dates = data.map((h) => new Date(h.date + "T00:00:00"));
      setHolidays(dates);
    } catch (error) {
      console.error("Erro ao buscar feriados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os feriados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addHoliday = useCallback(async (date: Date, description?: string) => {
    try {
      const dateStr = date.toISOString().split("T")[0];
      
      const { error } = await supabase
        .from("holidays")
        .insert({ date: dateStr, description });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Aviso",
            description: "Este feriado já está cadastrado",
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      await fetchHolidays();
      return true;
    } catch (error) {
      console.error("Erro ao adicionar feriado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o feriado",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchHolidays, toast]);

  const addHolidayRange = useCallback(async (startDate: Date, endDate: Date, description?: string) => {
    try {
      const dates: { date: string; description: string | undefined }[] = [];
      const current = new Date(startDate);
      current.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(0, 0, 0, 0);

      while (current <= end) {
        dates.push({
          date: current.toISOString().split("T")[0],
          description,
        });
        current.setDate(current.getDate() + 1);
      }

      const { error } = await supabase
        .from("holidays")
        .upsert(dates, { onConflict: "date" });

      if (error) throw error;

      await fetchHolidays();
      toast({
        title: "Sucesso",
        description: `${dates.length} dias adicionados ao período de recesso`,
      });
      return true;
    } catch (error) {
      console.error("Erro ao adicionar período de recesso:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o período de recesso",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchHolidays, toast]);

  const removeHoliday = useCallback(async (date: Date) => {
    try {
      const dateStr = date.toISOString().split("T")[0];
      
      const { error } = await supabase
        .from("holidays")
        .delete()
        .eq("date", dateStr);

      if (error) throw error;

      await fetchHolidays();
      return true;
    } catch (error) {
      console.error("Erro ao remover feriado:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o feriado",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchHolidays, toast]);

  const clearAllHolidays = useCallback(async () => {
    try {
      const { error } = await supabase
        .from("holidays")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      await fetchHolidays();
      toast({
        title: "Sucesso",
        description: "Todos os feriados foram removidos",
      });
      return true;
    } catch (error) {
      console.error("Erro ao limpar feriados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível limpar os feriados",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchHolidays, toast]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  return {
    holidays,
    loading,
    addHoliday,
    addHolidayRange,
    removeHoliday,
    clearAllHolidays,
    refetch: fetchHolidays,
  };
}
