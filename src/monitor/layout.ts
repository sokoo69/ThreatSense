import { Box } from './types';

export const VIEWPORT_ASPECT = 16 / 9;

/**
 * Detection boxes are relative to the video, but a clip that is not 16:9 is shown with
 * black bars inside the viewport. This converts a box to viewport coordinates so it
 * stays on the face whatever the shape of the video.
 */
export function fitBoxToViewport(box: Box, videoAspect: number): Box {
  if (!Number.isFinite(videoAspect) || videoAspect <= 0) return box;

  if (videoAspect < VIEWPORT_ASPECT) {
    const scale = videoAspect / VIEWPORT_ASPECT;
    return { ...box, x: (1 - scale) / 2 + box.x * scale, w: box.w * scale };
  }

  const scale = VIEWPORT_ASPECT / videoAspect;
  return { ...box, y: (1 - scale) / 2 + box.y * scale, h: box.h * scale };
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, '0')}`;
}
