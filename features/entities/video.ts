/**
 * Pure. Turns any YouTube/Vimeo URL a person might paste into a normalized
 * { provider, videoId }. Embeds cost nothing and play better than self-hosted
 * video (D43). No network, fully testable.
 */
export type VideoProvider = "youtube" | "vimeo";

export interface ParsedVideo {
  provider: VideoProvider;
  videoId: string;
}

export function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = raw.trim();
  if (!url) return null;

  // youtu.be/ID , youtube.com/watch?v=ID , /embed/ID , /shorts/ID
  const yt =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return { provider: "youtube", videoId: yt[1] };

  // vimeo.com/ID
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { provider: "vimeo", videoId: vm[1] };

  return null;
}

export function embedUrl(provider: VideoProvider, videoId: string): string {
  return provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${videoId}`
    : `https://player.vimeo.com/video/${videoId}`;
}
