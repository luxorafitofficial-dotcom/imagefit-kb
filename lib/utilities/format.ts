export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(decimals)} KB`;
  }
  
  const mb = kb / 1024;
  return `${mb.toFixed(decimals)} MB`;
}

export function formatKBOnly(bytes: number, decimals: number = 1): string {
  const kb = bytes / 1024;
  return `${kb.toFixed(decimals)} KB`;
}

export function formatPercentage(part: number, total: number): string {
  if (total <= 0) return '0%';
  const diff = ((total - part) / total) * 100;
  return `${Math.max(0, diff).toFixed(1)}%`;
}

export function getCleanFormatName(mimeOrExt: string): string {
  const lower = mimeOrExt.toLowerCase();
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'JPEG';
  if (lower.includes('png')) return 'PNG';
  if (lower.includes('webp')) return 'WebP';
  return mimeOrExt.toUpperCase();
}

