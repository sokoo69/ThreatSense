import { RefObject, useEffect } from 'react';
import { monitorStore } from '../../store/useMonitorStore';

const CAPTURE_WIDTH = 640;
const JPEG_QUALITY = 0.7;
/** Raise this if the backend's lip reading needs a higher frame rate. */
const UPLINK_FPS = 5;

/** Lets log rows capture this video, and streams it to the backend when one is connected. */
export function useVideoTap(videoRef: RefObject<HTMLVideoElement | null>, active: boolean) {
  useEffect(() => {
    const video = videoRef.current;
    if (!active || !video) return;

    const canvas = document.createElement('canvas');

    const drawFrame = () => {
      const context = canvas.getContext('2d');
      if (!context || video.readyState < 2 || !video.videoWidth) return false;
      canvas.width = CAPTURE_WIDTH;
      canvas.height = Math.round((CAPTURE_WIDTH * video.videoHeight) / video.videoWidth);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return true;
    };

    const { setFrameGrabber, sendVideoFrame } = monitorStore.getState();
    const unregister = setFrameGrabber(() =>
      drawFrame() ? canvas.toDataURL('image/jpeg', JPEG_QUALITY) : null
    );

    const uplink =
      sendVideoFrame &&
      setInterval(() => {
        if (video.paused || !drawFrame()) return;
        canvas.toBlob((jpeg) => jpeg && sendVideoFrame(jpeg), 'image/jpeg', JPEG_QUALITY);
      }, 1000 / UPLINK_FPS);

    return () => {
      unregister();
      if (uplink) clearInterval(uplink);
    };
  }, [videoRef, active]);
}
