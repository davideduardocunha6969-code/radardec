/**
 * Converts an Excel serial date number to DD/MM/YYYY string.
 * Excel epoch: Jan 0, 1900 (with the Lotus 123 bug for Feb 29, 1900).
 */
export function excelSerialToDate(serial: number): string {
  // Excel epoch: Dec 30, 1899
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + serial * 86400000);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Formats a value as DD/MM/YYYY if it looks like an Excel serial number.
 * If it's already a date string, returns as-is.
 */
/**
 * Returns elapsed time from a date as "Xd Xh Xmin".
 */
export function formatElapsedTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return "agora";
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}min`;
  return `${mins}min`;
}

export function formatDateValue(value: string): string {
  if (!value) return value;
  // Already formatted as date
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  // Excel serial number
  const num = Number(value);
  if (!isNaN(num) && num > 1000 && num < 100000) {
    return excelSerialToDate(num);
  }
  return value;
}
