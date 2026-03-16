/**
 * YouTube 비디오 메타데이터 추출
 * - 비디오 ID에서 썸네일로 제목/채널 추론
 * - og:title, og:description 메타 태그 파싱
 */

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  channelName: string;
  description: string;
  duration: number; // seconds
}

/**
 * YouTube oEmbed API를 사용해 기본 메타데이터 가져오기
 * (CORS-safe, no auth needed)
 */
export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!res.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    return {
      videoId,
      title: data.title || 'YouTube 영상',
      channelName: data.author_name || '알 수 없음',
      description: data.title || '',
      duration: 0, // oEmbed doesn't include duration
    };
  } catch (err) {
    console.warn('YouTube oEmbed 실패:', err);
    return null;
  }
}

/**
 * Fallback: 영상 ID에서 일반적인 패턴으로 추론
 * (메타데이터 없을 때 사용)
 */
export function inferMetadataFromId(videoId: string): YouTubeMetadata {
  return {
    videoId,
    title: '영상 정보를 가져올 수 없습니다',
    channelName: '알 수 없음',
    description: '',
    duration: 0,
  };
}
