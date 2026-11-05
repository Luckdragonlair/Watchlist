import type { Source, ImportRow } from './model';
export const isSilo = (title: string) => /^silo(?:\b|_)/i.test(title.trim().normalize('NFKC'));
export function prepareSource(name: string, raw: string): Source {
  let input: unknown[];
  if (name.toLowerCase().endsWith('.json')) {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of titles or {title, notes} rows.');
    input = parsed;
  } else input = raw.split(/\r?\n/).filter(line => line.trim());
  const rows: ImportRow[] = input.map((value, i) => {
    if (typeof value !== 'string' && (!value || typeof value !== 'object' || !('title' in value) || typeof value.title !== 'string')) throw new Error(`Row ${i + 1} needs a title. No rows were saved.`);
    const title = (typeof value === 'string' ? value : (value as {title: string}).title).trim();
    if (!title) throw new Error(`Row ${i + 1} has an empty title.`);
    const notes = typeof value === 'object' && value && 'notes' in value ? String(value.notes) : '';
    return { id: String(i), title, notes, state: isSilo(title) ? 'excluded' : /^re\s+s[34]$/i.test(title) ? 'review' : 'pending' };
  });
  return { id: crypto.randomUUID(), name, raw, importedAt: new Date().toISOString(), rows };
}
