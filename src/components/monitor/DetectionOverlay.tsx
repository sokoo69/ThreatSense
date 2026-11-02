import { fitBoxToViewport } from '../../monitor/layout';
import { Box } from '../../monitor/types';

function Frame({ box, label, tone }: { box: Box; label: string; tone: string }) {
  return (
    <div
      className={`absolute border transition-[left,top,width,height] duration-300 ${tone}`}
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
      }}
    >
      <span className="absolute bottom-full left-[-1px] whitespace-nowrap bg-slate-950/80 px-1 py-px text-[11px] font-semibold">
        {label}
      </span>
    </div>
  );
}

/** Pass `videoAspect` when the boxes sit over a video letterboxed inside a 16:9 viewport. */
export function DetectionOverlay({
  faceBox,
  lipBox,
  videoAspect,
}: {
  faceBox: Box | null;
  lipBox: Box | null;
  videoAspect?: number;
}) {
  const place = (box: Box) => (videoAspect ? fitBoxToViewport(box, videoAspect) : box);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {faceBox && (
        <Frame box={place(faceBox)} label="Face: 96x96" tone="border-cyan-400 text-cyan-300" />
      )}
      {lipBox && (
        <Frame box={place(lipBox)} label="Lip ROI: 50x100" tone="border-yellow-400 text-yellow-300" />
      )}
    </div>
  );
}
