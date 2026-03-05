// ABOUTME: Client-side CSV generation and download utility
// ABOUTME: Used for exporting analytics data and RSS entries from control panel

export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: { key: string; label: string }[]
) {
  if (!data || data.length === 0) return;

  const cols = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  const header = cols.map(c => escapeCSV(c.label)).join(',');
  const rows = data.map(row =>
    cols.map(c => escapeCSV(String(row[c.key] ?? ''))).join(',')
  );

  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
