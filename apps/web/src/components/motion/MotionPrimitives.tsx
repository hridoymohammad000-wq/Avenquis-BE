import React, { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

export const motionEase = [0.16, 1, 0.3, 1] as const;

export const Reveal: React.FC<{
  children: ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 14 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.38, delay, ease: motionEase }}
  >
    {children}
  </motion.div>
);

export const ViewTransition: React.FC<{
  children: ReactNode;
  viewKey: string;
}> = ({ children, viewKey }) => (
  <motion.div
    key={viewKey}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24, ease: motionEase }}
  >
    {children}
  </motion.div>
);

export const MotionSurface: React.FC<HTMLMotionProps<"div">> = ({
  children,
  className,
  ...props
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 8, scale: 0.985 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.22, ease: motionEase }}
    {...props}
  >
    {children}
  </motion.div>
);

export const AnimatedNumber: React.FC<{ value: number; decimals?: number }> = ({
  value,
  decimals = 0,
}) => {
  const reduceMotion = useReducedMotion();
  const [displayedValue, setDisplayedValue] = useState(
    reduceMotion ? value : 0,
  );

  useEffect(() => {
    if (reduceMotion) {
      setDisplayedValue(value);
      return;
    }

    const startValue = displayedValue;
    const startedAt = performance.now();
    const duration = 340;
    let frameId = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayedValue(startValue + (value - startValue) * easedProgress);
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, reduceMotion]);

  return <>{displayedValue.toFixed(decimals)}</>;
};

export const MotionProgressBar: React.FC<{
  value: number;
  className?: string;
}> = ({ value, className }) => (
  <motion.div
    className={className}
    initial={{ width: "0%" }}
    animate={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
    transition={{ duration: 0.34, ease: motionEase }}
  />
);
