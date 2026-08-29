'use client';

import { useEffect, useRef, useState } from 'react';

/** Counts from the previous value to the next one so numbers feel alive. */
export default function AnimatedNumber({ value, duration = 620, format }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return undefined;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      fromRef.current = to;
      setDisplay(to);
      return undefined;
    }

    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  const rounded = Math.round(display);
  return <>{format ? format(rounded) : rounded}</>;
}
