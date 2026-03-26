// -- Progress Canvas -- HUD element
import { useEffect, useRef } from 'react';

interface Props {
  completed: number;
  total: number;
}

export default function ProgressCanvas({ completed, total }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const cx = 20, cy = 20, r = 15;

    ctx.clearRect(0, 0, 40, 40);

    // Track ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    // Filled arc (clockwise from top)
    if (completed > 0 && total > 0) {
      const pct = Math.min(1, completed / total);
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
      ctx.strokeStyle = "#4a90c4";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }, [completed, total]);

  // Finding 20 — aria-label provides accessible name for screen readers
  return (
    <canvas
      ref={canvasRef}
      width={40}
      height={40}
      style={{ opacity: 0.85, display: "block" }}
      role="progressbar"
      aria-label={`התקדמות: ${completed} מתוך ${total} משימות`}
      aria-valuenow={completed}
      aria-valuemin={0}
      aria-valuemax={total}
    />
  );
}
