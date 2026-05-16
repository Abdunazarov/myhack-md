/** Shared motion tokens — use across all pages for consistent feel */
export const pageEnter = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

export const headerEnter = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

export const staggerStep = 0.08;
export const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export const cardHover =
  "transition-all duration-300 hover:shadow-md hover:border-primary/25 hover:-translate-y-0.5";
