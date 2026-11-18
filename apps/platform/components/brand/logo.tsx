import { cn } from "cn";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#24272D" />
        <path d="M9 10h10.5a4.5 4.5 0 0 1 0 9H14" stroke="#F79432" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M14 15.5h8.2" stroke="#FFB15C" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="22.5" cy="22" r="2" fill="#F79432" />
      </svg>
      <span className={light ? "text-white" : "text-foreground"}>
        Shad<span className="text-[#F79432]">Tech</span>
      </span>
    </span>
  );
}
