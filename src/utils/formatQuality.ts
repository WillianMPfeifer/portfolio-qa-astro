export function formatBundleSize(bytes: number | null): string {
  if (bytes === null) return 'indisponível';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string | null): string {
  if (iso === null) return 'indisponível';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());
  const h = pad(date.getUTCHours());
  const min = pad(date.getUTCMinutes());
  return `${y}-${m}-${d} ${h}:${min} UTC`;
}

export function formatScore(score: number | null): string {
  if (score === null) return 'indisponível';
  return String(Math.round(score * 100));
}
