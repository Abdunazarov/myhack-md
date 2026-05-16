import { motion } from "motion/react";

type StepTabsProps = {
  steps: string[];
  current: number;
  onChange: (index: number) => void;
  layoutId?: string;
};

export default function StepTabs({
  steps,
  current,
  onChange,
  layoutId = "step-tabs-underline",
}: StepTabsProps) {
  return (
    <nav className="flex gap-1 border-b border-outline-variant mb-8 overflow-x-auto">
      {steps.map((label, i) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(i)}
          className={`relative shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
            current === i
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-background"
          }`}
        >
          <span className="flex items-center gap-2">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                current === i
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </span>
          {current === i && (
            <motion.span
              layoutId={layoutId}
              className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
        </button>
      ))}
    </nav>
  );
}
