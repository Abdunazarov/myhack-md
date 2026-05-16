import type { ReactNode } from "react";
import { cardHover } from "../layout/motion";

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
};

const paddingClass = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function SurfaceCard({
  children,
  className = "",
  hover = true,
  padding = "md",
}: SurfaceCardProps) {
  return (
    <div
      className={`rounded-2xl border border-outline-variant bg-surface-container-lowest ${paddingClass[padding]} ${
        hover ? cardHover : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
