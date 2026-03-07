// ── YouTube Transcript Fetcher ────────────────────────────────────────────────
// YouTube의 timedtext API를 이용해 자막을 가져옵니다.
// CORS-safe (public videos). 자막이 없거나 CORS 차단 시 gracefully fallback.

export interface TranscriptSegment {
  text:     string;
  start:    number;   // seconds
  duration: number;   // seconds
}

export interface TranscriptResult {
  segments: TranscriptSegment[];
  language: string;
  available: boolean;
}

// ── Fetch transcript ──────────────────────────────────────────────────────────

export async function fetchYoutubeTranscript(videoId: string): Promise<TranscriptResult> {
  const empty: TranscriptResult = { segments: [], language: 'none', available: false };

  // Try Korean → English → Japanese, manual captions first, then ASR auto-generated
  const attempts = [
    { lang: 'ko', kind: '' },
    { lang: 'en', kind: '' },
    { lang: 'ja', kind: '' },
    { lang: 'ko', kind: 'asr' },
    { lang: 'en', kind: 'asr' },
  ];

  for (const { lang, kind } of attempts) {
    try {
      const kindParam = kind ? `&kind=${kind}` : '';
      const url =
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}${kindParam}&fmt=json3`;

      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await res.json();
      if (!data.events || !Array.isArray(data.events)) continue;

      const segments: TranscriptSegment[] = data.events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((e: any) => Array.isArray(e.segs))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((e: any) => ({
          text: (e.segs as { utf8?: string }[])
            .map((s) => s.utf8 ?? '')
            .join('')
            .replace(/\n/g, ' ')
            .trim(),
          start:    (e.tStartMs    ?? 0) / 1000,
          duration: (e.dDurationMs ?? 0) / 1000,
        }))
        .filter((s: TranscriptSegment) => s.text.length > 1);

      if (segments.length > 15) {
        return { segments, language: lang, available: true };
      }
    } catch {
      // Continue to next attempt
    }
  }

  return empty;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Format transcript with timestamps for LLM prompt (max maxChars chars) */
export function formatTranscriptForPrompt(
  segments: TranscriptSegment[],
  maxChars = 14000,
): string {
  let out = '';
  for (const seg of segments) {
    const m = Math.floor(seg.start / 60);
    const s = Math.floor(seg.start % 60);
    const line = `[${m}:${s.toString().padStart(2, '0')}] ${seg.text}\n`;
    if (out.length + line.length > maxChars) break;
    out += line;
  }
  return out;
}

/** Group segments into ~chunkSec-second chunks for chunked analysis */
export function chunkTranscript(
  segments: TranscriptSegment[],
  chunkSec = 90,
): TranscriptSegment[][] {
  if (segments.length === 0) return [];
  const chunks: TranscriptSegment[][] = [];
  let current: TranscriptSegment[] = [];
  let startTime = segments[0].start;

  for (const seg of segments) {
    if (seg.start - startTime >= chunkSec && current.length > 0) {
      chunks.push(current);
      current = [];
      startTime = seg.start;
    }
    current.push(seg);
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/** Total text character count */
export function transcriptTextLength(segments: TranscriptSegment[]): number {
  return segments.reduce((acc, s) => acc + s.text.length, 0);
}

/** Format one chunk as a prompt string with time range header */
export function formatChunkForPrompt(chunk: TranscriptSegment[]): string {
  if (chunk.length === 0) return '';
  const startM = Math.floor(chunk[0].start / 60);
  const startS = Math.floor(chunk[0].start % 60);
  const endM   = Math.floor((chunk[chunk.length - 1].start + chunk[chunk.length - 1].duration) / 60);
  const endS   = Math.floor((chunk[chunk.length - 1].start + chunk[chunk.length - 1].duration) % 60);
  const header = `[${startM}:${startS.toString().padStart(2, '0')} - ${endM}:${endS.toString().padStart(2, '0')}]\n`;
  return header + chunk.map((s) => s.text).join(' ');
}
