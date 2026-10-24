"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import useReveal from "./useReveal";

/** Counts up to `value` the first time it comes into view. */
export default function CountUp({ value, prefix = "", suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const revealed = useReveal(ref);
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!revealed || reduceMotion) return;
    const controls = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: setDisplay });
    return () => controls.stop();
  }, [revealed, value, reduceMotion]);

  // With reduced motion the final number shows straight away, no animation.
  const shown = reduceMotion ? value : display;

  return (
    <span ref={ref} className="tabular-nums">
      {/* Screen readers and search engines get the final number straight away. */}
      <span className="sr-only">{`${prefix}${value}${suffix}`}</span>
      <span aria-hidden>
        {prefix}
        {shown.toFixed(decimals)}
        {suffix}
      </span>
    </span>
  );
}
