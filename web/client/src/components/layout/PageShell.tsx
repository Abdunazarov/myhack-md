import type { ReactNode } from "react";
import { motion } from "motion/react";
import { headerEnter, pageEnter, staggerChild, staggerStep } from "./motion";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function PageShell({ children, className = "", narrow = false }: PageShellProps) {
  return (
    <motion.div
      className={`mx-auto w-full px-gutter md:px-margin-desktop py-8 md:py-10 ${
        narrow ? "max-w-3xl" : "max-w-6xl"
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.header
      initial={headerEnter.initial}
      animate={headerEnter.animate}
      transition={headerEnter.transition}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-on-background tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-on-surface-variant mt-2 text-base leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.header>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={pageEnter.initial}
      animate={pageEnter.animate}
      transition={{ ...pageEnter.transition, delay }}
      className={`min-w-0 ${className}`.trim()}
    >
      {children}
    </motion.div>
  );
}

export function StaggerGrid({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerStep } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: staggerChild.hidden,
        visible: staggerChild.visible,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
