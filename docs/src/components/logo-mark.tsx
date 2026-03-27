export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center select-none shrink-0 w-6 h-6 rounded ${className}`}
      style={{ background: "oklch(0.55 0.20 264)", color: "#fff" }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
        <path
          d="M2 20L7.5 4L12 17L16.5 4L22 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M4.5 14H10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M13.5 14H19.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  )
}
