import * as React from 'react';

export default function ReactIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 841.9 595.3"
      width={16}
      height={16}
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <g fill="none" stroke="currentColor" strokeWidth="40">
        <ellipse cx="420.9" cy="296.5" rx="110" ry="180" />
        <ellipse
          cx="420.9"
          cy="296.5"
          rx="110"
          ry="180"
          transform="rotate(60 420.9 296.5)"
        />
        <ellipse
          cx="420.9"
          cy="296.5"
          rx="110"
          ry="180"
          transform="rotate(120 420.9 296.5)"
        />
      </g>
      <circle cx="420.9" cy="296.5" r="35" />
    </svg>
  );
}
