/**
 * Normalizes a CPF string: strips non-digits, pads to 11 digits with leading zeros.
 */
export function normalizeCpf(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.padStart(11, "0");
}

/**
 * Formats a CPF string as ###.###.###-##
 */
export function formatCpf(value: string): string {
  const digits = normalizeCpf(value);
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Checks if a campo key represents a CPF field.
 */
export function isCpfKey(key: string): boolean {
  return key === "cpf" || key === "__cpf__";
}
