// Single source of truth for the Ayumonk brand mark — two interlocking
// infinity loops in the brand greens. Any place that needs to render the
// logo should import from here rather than redefining the SVG locally.

export default function AyuLogo({ size = 32, ariaLabel = "Ayumonk" }) {
  return (
    <svg
      width={size * 1.65}
      height={size * 0.72}
      viewBox="0 0 120 52"
      fill="none"
      role="img"
      aria-label={ariaLabel}
    >
      <path
        d="M60 26C60 26 48 4 30 4 14 4 4 14 4 26 4 38 14 48 30 48 48 48 60 26 60 26Z"
        stroke="#4a7c2f"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M60 26C60 26 72 4 90 4 106 4 116 14 116 26 116 38 106 48 90 48 72 48 60 26 60 26Z"
        stroke="#6db33f"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M88 6C92 2 100 4 98 12 96 18 88 20 84 16 80 12 82 8 88 6Z"
        fill="#4a7c2f"
      />
    </svg>
  );
}
