"use client";

import { useEffect, useRef, useState } from "react";
import SlideCanvas from "@/components/SlideCanvas";
import type { Slide, Theme } from "@/types/slide";

interface Props {
  slide: Slide;
  theme: Theme;
  accent: string;
  nativeWidth?: number;
  animate?: boolean;
  editable?: boolean;
  onEdit?: (patch: Partial<Slide>) => void;
}

export default function ScaledSlide({
  slide,
  theme,
  accent,
  nativeWidth = 960,
  animate = false,
  editable = false,
  onEdit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const nativeHeight = (nativeWidth * 9) / 16;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / nativeWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [nativeWidth]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <div
        style={{
          width: nativeWidth,
          height: nativeHeight,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        <SlideCanvas
          slide={slide}
          theme={theme}
          accent={accent}
          animate={animate}
          editable={editable}
          onEdit={onEdit}
        />
      </div>
    </div>
  );
}
