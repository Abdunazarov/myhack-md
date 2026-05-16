import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-primary shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98]",
  secondary:
    "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low active:scale-[0.98]",
  ghost: "text-on-surface-variant hover:text-on-background hover:bg-surface-container-low",
  danger: "bg-error text-on-error hover:brightness-105 active:scale-[0.98]",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
