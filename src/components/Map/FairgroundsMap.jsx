import { useRef, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';

// ---- Pin styling constants ----
export const PIN_COLORS = {
  food:     '#E53935', // red
  music:    '#8E24AA', // purple
  activity: '#43A047', // green
  show:     '#1E88E5', // blue
  exhibit:  '#FB8C00', // orange
};

export const PIN_EMOJIS = {
  food:     '🌭',
  music:    '🎵',
  activity: '🎡',
  show:     '🎭',
  exhibit:  '🏛',
};

export const AUTHOR_COLORS = [
  '#E91E63', '#00ACC1', '#7CB342', '#FFB300',
  '#5E35B1', '#00897B', '#F4511E', '#546E7A',
];

// ---- Draw a single pin on the canvas ----
function drawPin(ctx, pin, cx, cy, authorColor, dpr) {
  const r = 14 * dpr;

  ctx.save();

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 5 * dpr;
  ctx.shadowOffsetY = 2 * dpr;

  // Pin circle body — colored by author so it matches the filter chip
  ctx.beginPath();
  ctx.arc(cx, cy - r * 1.6, r, 0, Math.PI * 2);
  ctx.fillStyle = authorColor;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2 * dpr;
  ctx.stroke();

  // Pin pointer tip — same author color
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy - r * 0.85);
  ctx.lineTo(cx + r * 0.45, cy - r * 0.85);
  ctx.lineTo(cx, cy);
  ctx.fillStyle = authorColor;
  ctx.fill();

  // Emoji icon inside circle (identifies pin type)
  ctx.font = `${r * 1.1}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(PIN_EMOJIS[pin.type], cx, cy - r * 1.6);

  // Clock badge for time-constrained pins (top-right of circle)
  if (pin.start_time) {
    ctx.font = `${r * 0.75}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏰', cx + r * 0.95, cy - r * 2.45);
  }

  ctx.restore();
}

// ---- Hit-test: is a CSS-space click near a pin? ----
function hitTestPin(cssX, cssY, pin, view, imgW, imgH) {
  const pinScreenX = view.x + pin.x * imgW * view.scale;
  const pinScreenY = view.y + pin.y * imgH * view.scale;
  const dist = Math.sqrt(Math.pow(cssX - pinScreenX, 2) + Math.pow(cssY - pinScreenY, 2));
  return dist < 28; // 28px CSS hit radius
}

// ---- Utility: distance between two touch points ----
function touchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function touchMid(touches) {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

// ============================================================
// FairgroundsMap component
// ============================================================
export default function FairgroundsMap({
  pins,
  members,
  placing,
  currentUserId,
  onPlacePin,
  onPinClick,
}) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const viewRef = useRef({ x: 0, y: 0, scale: 1 });
  const pinsRef = useRef(pins);
  const membersRef = useRef(members);
  const animRef = useRef(null);

  // Gesture state refs (avoid re-renders)
  const drag = useRef({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, moved: false });
  const pinch = useRef({ active: false, lastDist: 0, lastMid: { x: 0, y: 0 } });
  const tap = useRef({ startTime: 0, startX: 0, startY: 0 });
  const userHasManualView = useRef(false);

  // Keep refs in sync with props so draw() always has latest data
  useEffect(() => { pinsRef.current = pins; }, [pins]);
  useEffect(() => { membersRef.current = members; }, [members]);

  // ---- Draw ----
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const img = imgRef.current;
    const { x, y, scale } = viewRef.current;
    const currentPins = pinsRef.current;
    const currentMembers = membersRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (img) {
      ctx.drawImage(img, x * dpr, y * dpr, img.width * scale * dpr, img.height * scale * dpr);
    }

    currentPins.forEach((pin) => {
      const imgW = img?.width ?? 1;
      const imgH = img?.height ?? 1;
      const screenX = x + pin.x * imgW * scale;
      const screenY = y + pin.y * imgH * scale;
      const memberIdx = currentMembers.findIndex((m) => m.id === pin.user_id);
      const member = memberIdx >= 0 ? currentMembers[memberIdx] : null;
      const authorColor = member?.color || AUTHOR_COLORS[Math.max(0, memberIdx) % AUTHOR_COLORS.length];
      drawPin(ctx, pin, screenX * dpr, screenY * dpr, authorColor, dpr);
    });

    // Crosshair cursor overlay when in placing mode
    if (placing) {
      const w = canvas.width;
      const h = canvas.height;
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([6 * dpr, 4 * dpr]);
      ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      ctx.restore();
    }
  }, [placing]);

  const requestDraw = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // Redraw when pins, members, or placing mode change
  useEffect(() => { requestDraw(); }, [pins, members, placing, requestDraw]);

  // ---- Load map image ----
  useEffect(() => {
    const img = new Image();
    img.src = '/MN_STATE_FAIR.svg';
    img.onload = () => {
      imgRef.current = img;
      fitImage();
      requestDraw();
    };
    img.onerror = () => console.warn('Could not load MN_STATE_FAIR.svg — place it in /public/');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fitImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    const scale = Math.min(cw / img.width, ch / img.height) * 0.92;
    viewRef.current = {
      x: (cw - img.width * scale) / 2,
      y: (ch - img.height * scale) / 2,
      scale,
    };
  }, []);

  // ---- Resize observer: keep canvas resolution sharp ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      if (!userHasManualView.current) fitImage();
      requestDraw();
    });

    ro.observe(canvas);
    return () => ro.disconnect();
  }, [fitImage, requestDraw]);

  // ---- Tap handler (shared by mouse + touch) ----
  const handleTap = useCallback((cssX, cssY) => {
    const img = imgRef.current;
    const view = viewRef.current;
    const imgW = img?.width ?? 1;
    const imgH = img?.height ?? 1;

    // Check if tap hits an existing pin (iterate in reverse — topmost first)
    const tapped = [...pinsRef.current].reverse().find((pin) =>
      hitTestPin(cssX, cssY, pin, view, imgW, imgH)
    );

    if (tapped) {
      onPinClick(tapped);
      return;
    }

    if (placing && img) {
      const normX = (cssX - view.x) / (imgW * view.scale);
      const normY = (cssY - view.y) / (imgH * view.scale);
      if (normX >= 0 && normX <= 1 && normY >= 0 && normY <= 1) {
        onPlacePin(normX, normY);
      }
    }
  }, [placing, onPinClick, onPlacePin]);

  // ---- Zoom around a CSS-space focal point ----
  const applyZoom = useCallback((focalX, focalY, factor) => {
    userHasManualView.current = true;
    const { x, y, scale } = viewRef.current;
    const newScale = Math.min(Math.max(scale * factor, 0.3), 20);
    viewRef.current = {
      x: focalX - (focalX - x) * (newScale / scale),
      y: focalY - (focalY - y) * (newScale / scale),
      scale: newScale,
    };
  }, []);

  // ---- Mouse events ----
  const onMouseDown = useCallback((e) => {
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.lastX;
    const dy = e.clientY - drag.current.lastY;
    drag.current.lastX = e.clientX;
    drag.current.lastY = e.clientY;
    const moved = Math.abs(e.clientX - drag.current.startX) + Math.abs(e.clientY - drag.current.startY);
    if (moved > 6) { drag.current.moved = true; userHasManualView.current = true; }
    viewRef.current.x += dx;
    viewRef.current.y += dy;
    requestDraw();
  }, [requestDraw]);

  const onMouseUp = useCallback((e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (!drag.current.moved) {
      const rect = canvasRef.current.getBoundingClientRect();
      handleTap(e.clientX - rect.left, e.clientY - rect.top);
    }
  }, [handleTap]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;
    applyZoom(focalX, focalY, e.deltaY > 0 ? 0.85 : 1.15);
    requestDraw();
  }, [applyZoom, requestDraw]);

  // ---- Touch events ----
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      tap.current = { startTime: Date.now(), startX: t.clientX, startY: t.clientY };
      drag.current = {
        active: true,
        startX: t.clientX,
        startY: t.clientY,
        lastX: t.clientX,
        lastY: t.clientY,
        moved: false,
      };
      pinch.current.active = false;
    } else if (e.touches.length === 2) {
      drag.current.active = false;
      pinch.current = {
        active: true,
        lastDist: touchDist(e.touches),
        lastMid: touchMid(e.touches),
      };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && drag.current.active) {
      const t = e.touches[0];
      const dx = t.clientX - drag.current.lastX;
      const dy = t.clientY - drag.current.lastY;
      drag.current.lastX = t.clientX;
      drag.current.lastY = t.clientY;
      const moved = Math.abs(t.clientX - drag.current.startX) + Math.abs(t.clientY - drag.current.startY);
      if (moved > 8) drag.current.moved = true;
      viewRef.current.x += dx;
      viewRef.current.y += dy;
      requestDraw();
    } else if (e.touches.length === 2 && pinch.current.active) {
      const dist = touchDist(e.touches);
      const mid = touchMid(e.touches);
      const zoomFactor = dist / pinch.current.lastDist;
      const dmx = mid.x - pinch.current.lastMid.x;
      const dmy = mid.y - pinch.current.lastMid.y;

      const { x, y, scale } = viewRef.current;
      const newScale = Math.min(Math.max(scale * zoomFactor, 0.3), 20);
      viewRef.current = {
        x: mid.x - (mid.x - x) * (newScale / scale) + dmx,
        y: mid.y - (mid.y - y) * (newScale / scale) + dmy,
        scale: newScale,
      };

      pinch.current.lastDist = dist;
      pinch.current.lastMid = mid;
      requestDraw();
    }
  }, [requestDraw]);

  const onTouchEnd = useCallback((e) => {
    if (e.changedTouches.length === 1 && drag.current.active && !drag.current.moved) {
      const duration = Date.now() - tap.current.startTime;
      if (duration < 400) {
        const rect = canvasRef.current.getBoundingClientRect();
        handleTap(
          tap.current.startX - rect.left,
          tap.current.startY - rect.top
        );
      }
    }
    drag.current.active = false;
    pinch.current.active = false;
  }, [handleTap]);

  // Attach wheel and touchmove as non-passive so preventDefault() works
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchmove', onTouchMove);
    };
  }, [onWheel, onTouchMove]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#e8f5e9' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: placing ? 'crosshair' : 'grab',
          touchAction: 'none',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      />
    </Box>
  );
}
