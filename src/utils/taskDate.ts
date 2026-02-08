const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseTaskDate(value?: string | null): Date | null {
  if (!value) return null;

  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, (month || 1) - 1, day || 1);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export function formatTaskDateZhCN(value?: string | null): string {
  const parsed = parseTaskDate(value);
  if (!parsed) return '-';
  return parsed.toLocaleDateString('zh-CN');
}
