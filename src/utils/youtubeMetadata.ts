export interface YouTubeMetadata {
  videoId: string;
  title: string;
  channelName: string;
  description: string;
  duration: number;
}

export async function fetchYouTubeMetadata(videoId: string): Promise<YouTubeMetadata | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const data: any = await res.json();
    return {
      videoId,
      title: data.title || 'YouTube 영상',
      channelName: data.author_name || '알 수 없음',
      description: data.title || '',
      duration: 0,
    };
  } catch (err) {
    console.warn('YouTube oEmbed 실패:', err);
    return null;
  }
}

export function inferMetadataFromId(videoId: string): YouTubeMetadata {
  return {
    videoId,
    title: '영상 정보를 가져올 수 없습니다',
    channelName: '알 수 없음',
    description: '',
    duration: 0,
  };
}
