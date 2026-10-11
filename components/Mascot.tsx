"use client";

import { useId } from "react";

interface MascotProps {
  size?: number;
  className?: string;
}

/**
 * Linh vật "Béo" của BinBeoAI — blob tròn vẽ tay bằng SVG thuần,
 * không dùng chữ cái hay emoji để tránh lẫn với chatbot mẫu đại trà.
 */
export function Mascot({ size = 32, className }: MascotProps) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const gid = `beo-${rawId}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCD34D" />
          <stop offset="0.55" stopColor="#F97316" />
          <stop offset="1" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="5" y="7" width="38" height="35" rx="15" fill={`url(#${gid})`} />
      <ellipse cx="17" cy="15" rx="6" ry="3.5" fill="#ffffff" opacity="0.35" />
      <circle cx="13" cy="27.5" r="3" fill="#FDA4AF" opacity="0.55" />
      <circle cx="35" cy="27.5" r="3" fill="#FDA4AF" opacity="0.55" />
      <circle cx="18.5" cy="23" r="2.7" fill="#431407" />
      <circle cx="29.5" cy="23" r="2.7" fill="#431407" />
      <circle cx="19.4" cy="22.1" r="0.9" fill="#ffffff" />
      <circle cx="30.4" cy="22.1" r="0.9" fill="#ffffff" />
      <path
        d="M19 29.5 Q24 34 29 29.5"
        stroke="#431407"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
