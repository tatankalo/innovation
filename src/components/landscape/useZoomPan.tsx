"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ZoomPan = ReturnType<typeof useZoomPan>;

const MAX_K = 10;

/**
 * Zoom and pan for an SVG map, kept inside the map so the page itself never zooms.
 * - Pinch on a trackpad (or Ctrl/Cmd + scroll) and pinch on a touch screen zoom the map.
 * - Drag moves it. Double-click zooms in. Plain scrolling still scrolls the page.
 * `w` and `h` are the SVG viewBox size; the returned transform is in viewBox units.
 */
export function useZoomPan(w: number, h: number) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [t, setT] = useState({ k: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false); // true when the last press was a drag, so clicks can be ignored
  const state = useRef(t);
  state.current = t;

  const clamp = useCallback(
    (k: number, x: number, y: number) => {
      const kk = Math.min(MAX_K, Math.max(1, k));
      return { k: kk, x: Math.min(0, Math.max(w * (1 - kk), x)), y: Math.min(0, Math.max(h * (1 - kk), y)) };
    },
    [w, h]
  );

  /** Client pixel -> viewBox point. */
  const toView = useCallback(
    (cx: number, cy: number) => {
      const r = ref.current!.getBoundingClientRect();
      return [((cx - r.left) / r.width) * w, ((cy - r.top) / r.height) * h] as const;
    },
    [w, h]
  );

  const zoomAt = useCallback(
    (factor: number, px = w / 2, py = h / 2) => {
      const { k, x, y } = state.current;
      const nk = Math.min(MAX_K, Math.max(1, k * factor));
      const f = nk / k;
      setT(clamp(nk, px - (px - x) * f, py - (py - y) * f));
    },
    [clamp, w, h]
  );
  const reset = useCallback(() => setT({ k: 1, x: 0, y: 0 }), []);
  /** Zoom to show a box [x0, y0, x1, y1] in viewBox units, centered. */
  const fit = useCallback(
    (box: [number, number, number, number]) => {
      const [x0, y0, x1, y1] = box;
      const k = Math.min(MAX_K, Math.max(1, Math.min(w / (x1 - x0), h / (y1 - y0))));
      setT(clamp(k, w / 2 - ((x0 + x1) / 2) * k, h / 2 - ((y0 + y1) / 2) * k));
    },
    [clamp, w, h]
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Trackpad pinch arrives as wheel + ctrlKey. Take it for the map and stop the page zoom.
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const [px, py] = toView(e.clientX, e.clientY);
      zoomAt(Math.exp(-e.deltaY * 0.01), px, py);
    };
    // Safari sends its own gesture events for pinch; cancel them so the page stays put.
    const stop = (e: Event) => e.preventDefault();

    const pts = new Map<number, { x: number; y: number }>();
    let last: { d: number; mx: number; my: number } | null = null;

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved.current = false;
      last = null;
      if (pts.size === 1 && (e.pointerType === "mouse" || state.current.k > 1)) setDragging(true);
    };
    const move = (e: PointerEvent) => {
      const p = pts.get(e.pointerId);
      if (!p) return;
      const r = el.getBoundingClientRect();
      const sx = w / r.width;
      const sy = h / r.height;
      if (pts.size === 1) {
        // One finger pans only once zoomed in, so a phone can still scroll past the map.
        if (e.pointerType !== "mouse" && state.current.k === 1) return;
        const dx = e.clientX - p.x;
        const dy = e.clientY - p.y;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const { k, x, y } = state.current;
        setT(clamp(k, x + dx * sx, y + dy * sy));
      } else if (pts.size === 2) {
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const [mx, my] = toView((a.x + b.x) / 2, (a.y + b.y) / 2);
        if (last) {
          moved.current = true;
          const { k, x, y } = state.current;
          const nk = Math.min(MAX_K, Math.max(1, k * (d / last.d)));
          const f = nk / k;
          // Zoom about the midpoint, and follow the midpoint as the fingers move.
          setT(clamp(nk, mx - (last.mx - x) * f, my - (last.my - y) * f));
        }
        last = { d, mx, my };
      }
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      last = null;
      if (pts.size === 0) setDragging(false);
    };
    const dbl = (e: MouseEvent) => {
      e.preventDefault();
      const [px, py] = toView(e.clientX, e.clientY);
      zoomAt(e.shiftKey ? 0.5 : 2, px, py);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("gesturestart", stop);
    el.addEventListener("gesturechange", stop);
    el.addEventListener("pointerdown", down);
    el.addEventListener("dblclick", dbl);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("gesturestart", stop);
      el.removeEventListener("gesturechange", stop);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("dblclick", dbl);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [clamp, toView, zoomAt, w, h]);

  return {
    ref,
    k: t.k,
    x: t.x,
    y: t.y,
    transform: `translate(${t.x} ${t.y}) scale(${t.k})`,
    zoomed: t.k > 1.001,
    dragging,
    moved,
    zoomAt,
    reset,
    fit,
    /** Marks stay close to their on-screen size while the map grows, so clusters pull apart as you zoom in. */
    markScale: 1 / Math.pow(t.k, 0.85),
    svgStyle: {
      // pan-y: one finger scrolls the page; pinch comes to us. Once zoomed in, the map takes every touch.
      touchAction: t.k > 1.001 ? "none" : "pan-y",
      cursor: dragging ? "grabbing" : "grab",
      userSelect: "none",
      WebkitUserSelect: "none",
    } as React.CSSProperties,
  };
}

export function ZoomControls({ zp }: { zp: ZoomPan }) {
  const btn =
    "w-9 h-9 grid place-items-center bg-surface text-ink hover:text-accent disabled:text-ink-3 disabled:hover:text-ink-3 text-[18px] leading-none";
  return (
    <div className="absolute right-3 bottom-3 flex flex-col border border-rule rounded-[4px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.12)] divide-y divide-rule">
      <button className={btn} onClick={() => zp.zoomAt(1.6)} disabled={zp.k >= MAX_K} aria-label="Zoom in" title="Zoom in">+</button>
      <button className={btn} onClick={() => zp.zoomAt(1 / 1.6)} disabled={!zp.zoomed} aria-label="Zoom out" title="Zoom out">−</button>
      <button className={btn} onClick={zp.reset} disabled={!zp.zoomed} aria-label="Reset map" title="Reset map">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M2 5V2h3M12 5V2H9M2 9v3h3M12 9v3H9" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}
