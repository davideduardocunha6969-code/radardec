// Calcula dias úteis entre duas datas, excluindo fins de semana e feriados

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(holiday => isSameDay(date, holiday));
}

export function calculateBusinessDays(
  startDate: Date,
  endDate: Date,
  holidays: Date[] = []
): number {
  if (startDate > endDate) return 0;
  
  let businessDays = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  
  while (current <= end) {
    if (!isWeekend(current) && !isHoliday(current, holidays)) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return businessDays;
}

export function getBusinessDaysUntilToday(
  startDate: Date,
  holidays: Date[] = []
): number {
  return calculateBusinessDays(startDate, new Date(), holidays);
}

// Calcula dias de atraso (dias úteis após a data esperada)
export function calculateDelayBusinessDays(
  expectedDate: Date,
  holidays: Date[] = []
): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expected = new Date(expectedDate);
  expected.setHours(0, 0, 0, 0);
  
  if (today <= expected) return 0;
  
  return calculateBusinessDays(expected, today, holidays) - 1; // -1 porque não conta o próprio dia
}

// Feriados nacionais brasileiros fixos (adicionar feriados móveis conforme necessário)
export function getDefaultBrazilianHolidays(year: number): Date[] {
  return [
    new Date(year, 0, 1),   // Confraternização Universal
    new Date(year, 3, 21),  // Tiradentes
    new Date(year, 4, 1),   // Dia do Trabalho
    new Date(year, 8, 7),   // Independência
    new Date(year, 9, 12),  // Nossa Senhora Aparecida
    new Date(year, 10, 2),  // Finados
    new Date(year, 10, 15), // Proclamação da República
    new Date(year, 11, 25), // Natal
  ];
}

export function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function parseDateBR(dateStr: string): Date | null {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  
  return date;
}
