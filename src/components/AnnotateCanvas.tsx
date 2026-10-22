'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconArrowBackUp, IconTrash } from '@tabler/icons-react';
import classes from './AnnotateCanvas.module.css';

export interface AnnotateHandle { toDataURL: (maxW?: number) => string }

const COLORS = ['#ff3b30', '#ffd60a', '#ffffff', '#0a84ff'];

/** Foto + lápiz libre para marcar el defecto o la zona. Mockup: sin flechas ni texto. */
export const AnnotateCanvas = forwardRef<AnnotateHandle, { src: string }>(function AnnotateCanvas({ src }, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLImageElement | null>(null);
  const strokes = useRef<{ c: string; pts: [number, number][] }[]>([]);
  const cur = useRef<{ c: string; pts: [number, number][] } | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [count, setCount] = useState(0);

  const redraw = useCallback(() => {
    const c = cv.current, img = base.current;
    if (!c || !img) return;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, c.width, c.height);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, c.width / 220);
    [...strokes.current, ...(cur.current ? [cur.current] : [])].forEach((s) => {
      ctx.strokeStyle = s.c; ctx.beginPath();
      s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]);
      ctx.stroke();
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = cv.current!;
      const k = Math.min(1, 1280 / img.width);
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      base.current = img; strokes.current = []; setCount(0); redraw();
    };
    img.src = src;
  }, [src, redraw]);

  useImperativeHandle(ref, () => ({
    toDataURL: (maxW = 800) => {
      const c = cv.current!;
      const k = Math.min(1, maxW / c.width);
      const t = document.createElement('canvas');
      t.width = Math.round(c.width * k); t.height = Math.round(c.height * k);
      t.getContext('2d')!.drawImage(c, 0, 0, t.width, t.height);
      return t.toDataURL('image/jpeg', 0.7);
    },
  }));

  const pt = (e: React.PointerEvent): [number, number] => {
    const r = cv.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * cv.current!.width, ((e.clientY - r.top) / r.height) * cv.current!.height];
  };

  return (
    <div className={classes.wrap}>
      <canvas
        ref={cv}
        className={classes.canvas}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); cur.current = { c: color, pts: [pt(e)] }; redraw(); }}
        onPointerMove={(e) => { if (cur.current) { cur.current.pts.push(pt(e)); redraw(); } }}
        onPointerUp={() => { if (cur.current) { strokes.current.push(cur.current); cur.current = null; setCount(strokes.current.length); redraw(); } }}
      />
      <Group className={classes.tools} gap={8}>
        {COLORS.map((c) => (
          <button key={c} className={classes.sw} data-on={c === color || undefined} style={{ background: c }} aria-label={`Color ${c}`} onClick={() => setColor(c)} />
        ))}
        <span className={classes.sep} />
        <Tooltip label="Deshacer"><ActionIcon variant="default" size={36} disabled={!count} aria-label="Deshacer" onClick={() => { strokes.current.pop(); setCount(strokes.current.length); redraw(); }}><IconArrowBackUp size={18} /></ActionIcon></Tooltip>
        <Tooltip label="Borrar marcas"><ActionIcon variant="default" size={36} disabled={!count} aria-label="Borrar marcas" onClick={() => { strokes.current = []; setCount(0); redraw(); }}><IconTrash size={18} /></ActionIcon></Tooltip>
      </Group>
    </div>
  );
});
