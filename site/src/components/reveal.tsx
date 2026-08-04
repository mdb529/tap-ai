"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll reveal.
 *
 * One IntersectionObserver per element, disconnected after it fires — this is an
 * entrance, not a state, so there is nothing to keep watching. Content starts
 * hidden via CSS and is revealed by flipping a data attribute, with a no-JS
 * fallback in globals.css so a static page opened from a link is never blank.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  /** ms. Use small staggers (60–120) for lists; anything longer feels broken. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.setAttribute("data-shown", "true");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      data-shown="false"
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
