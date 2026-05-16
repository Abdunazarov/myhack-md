import { Suspense, lazy, type ReactNode } from "react";

const Antigravity = lazy(() => import("./Antigravity"));

type AntigravityBackdropProps = {
  children: ReactNode;
  className?: string;
  height?: number | string;
  overlayClassName?: string;
};

export default function AntigravityBackdrop({
  children,
  className = "",
  height = 220,
  overlayClassName = "bg-surface-container-lowest/88 backdrop-blur-md",
}: AntigravityBackdropProps) {
  const h = typeof height === "number" ? `${height}px` : height;

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div className="absolute inset-0 w-full h-full" style={{ minHeight: h }}>
        <Suspense fallback={null}>
          <Antigravity
            count={220}
            magnetRadius={6}
            ringRadius={7}
            waveSpeed={0.4}
            waveAmplitude={1}
            particleSize={1.5}
            lerpSpeed={0.05}
            color="#0058be"
            autoAnimate
            particleVariance={1}
            rotationSpeed={0}
            depthFactor={1}
            pulseSpeed={3}
            particleShape="capsule"
            fieldStrength={10}
          />
        </Suspense>
      </div>
      <div className={`absolute inset-0 ${overlayClassName}`} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
