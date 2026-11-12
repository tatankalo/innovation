"use client";

export default function PrintButton({ label = "Print or save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 h-9 px-4 rounded-[2px] border border-rule hover:border-ink text-[14px] font-medium"
    >
      <svg width="13" height="13" viewBox="0 0 12 12" aria-hidden><path d="M3 4.5V1h6v3.5M3 9H1.5V4.5h9V9H9M3 7h6v4H3z" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
      {label}
    </button>
  );
}
