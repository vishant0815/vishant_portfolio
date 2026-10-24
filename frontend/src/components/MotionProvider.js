"use client";

import { MotionConfig } from "motion/react";

/** Every animation on the site respects the visitor's "reduce motion" setting. */
export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
