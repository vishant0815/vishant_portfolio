"use client";

import { useEffect, useState } from "react";

/**
 * True once the element has been on screen, or has already been scrolled past.
 * Unlike a plain IntersectionObserver, this can't get stuck when someone jumps
 * straight past the element (anchor links, fast flicks, restoring scroll on reload).
 */
export default function useReveal(ref) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || revealed) return;

    const check = () => {
      if (node.getBoundingClientRect().top < window.innerHeight * 0.92) setRevealed(true);
    };
    check();

    const observer = new IntersectionObserver(check, { threshold: [0, 0.25] });
    observer.observe(node);
    window.addEventListener("scroll", check, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", check);
    };
  }, [ref, revealed]);

  return revealed;
}
