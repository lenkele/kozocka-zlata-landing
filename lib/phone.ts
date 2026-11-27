// Телефон покупателя для оперативной связи (перенос, отмена показа).
// Принимаем любой понятный человеку формат: +972 50-123-4567, (050) 1234567, 0501234567.

export function normalizePhone(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

export function isValidPhone(value: string): boolean {
  if (!/^\+?[\d\s\-().]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}
