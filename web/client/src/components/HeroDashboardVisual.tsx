import { motion } from "motion/react";
import type { AppEntity } from "../context/AuthContext";

function DonutChart({ pct }: { pct: number }) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg viewBox="0 0 96 96" className="w-28 h-28 sm:w-32 sm:h-32">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
      <motion.circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke="url(#donutGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        transform="rotate(-90 48 48)"
      />
      <defs>
        <linearGradient id="donutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0058be" />
        </linearGradient>
      </defs>
      <text x="48" y="53" textAnchor="middle" className="fill-white font-bold" fontSize="22">
        {pct}%
      </text>
    </svg>
  );
}

function BarChart({ variant }: { variant: "benchmark" | "priority" }) {
  const bars =
    variant === "benchmark"
      ? [42, 68, 55, 82, 61, 74]
      : [92, 58, 74, 48];

  return (
    <div className="flex items-end gap-2 h-20 sm:h-24 w-full flex-1 min-h-[80px]">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 h-full flex items-end">
          <motion.div
            className="w-full rounded-sm bg-gradient-to-t from-cyan-500/80 to-primary/60 min-h-[6px]"
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.06, ease: "easeOut" }}
          />
        </div>
      ))}
    </div>
  );
}

function LineChart() {
  const points = "8,52 28,38 48,44 68,22 88,30";
  return (
    <svg viewBox="0 0 96 56" className="w-full h-16 sm:h-20">
      <polyline
        points={points}
        fill="none"
        stroke="rgba(34,211,238,0.25)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.polyline
        points={points}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.4, delay: 0.5, ease: "easeOut" }}
      />
      <defs>
        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0058be" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function HeroDashboardVisual({ entity }: { entity: AppEntity }) {
  const isStartup = entity === "startup";
  const readiness = isStartup ? 78 : 86;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full min-w-0 rounded-2xl border border-white/10 bg-[#0f1419] shadow-2xl overflow-hidden min-h-[340px] sm:min-h-[380px] lg:min-h-[420px] xl:min-h-[440px]"
    >
      <motion.div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-cyan-500/20 blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-primary/30 blur-3xl"
        animate={{ opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative p-6 md:p-8 h-full flex flex-col gap-5">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400/90 font-semibold">
              {isStartup ? "Intake" : "Cohort"}
            </p>
            <p className="text-white font-semibold text-base mt-1">
              {isStartup ? "Readiness" : "Health"}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
            Live
          </span>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <motion.div
            className="rounded-xl bg-white/5 border border-white/10 p-5 sm:p-6 flex flex-col items-center justify-center min-h-[140px]"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <DonutChart pct={readiness} />
            <p className="text-xs text-white/50 mt-2 text-center">
              {isStartup ? "Score" : "Health"}
            </p>
          </motion.div>

          <motion.div
            className="rounded-xl bg-white/5 border border-white/10 p-5 sm:p-6 flex flex-col min-h-[140px]"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-white/50 mb-3">
              {isStartup ? "Benchmark" : "Priority"}
            </p>
            <BarChart variant={isStartup ? "benchmark" : "priority"} />
          </motion.div>

          <motion.div
            className="col-span-2 rounded-xl bg-white/5 border border-white/10 p-5 sm:p-6 min-h-[130px]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-white/50">
                {isStartup ? "Routing" : "Outcomes"}
              </p>
              <p className="text-sm text-cyan-400 font-medium">+12% QoQ</p>
            </div>
            <LineChart />
          </motion.div>
        </div>

        <motion.div
          className="flex gap-2 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          {(isStartup
            ? ["Pre-accelerator", "Mentor ready", "Grant track"]
            : ["3 assigned", "2 interventions", "IT expertise"]
          ).map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/8 text-white/70 border border-white/10"
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
