"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Transition,
} from "motion/react";
import * as React from "react";

type Ripple = {
  id: number;
  x: number;
  y: number;
};

type RippleButtonContextValue = {
  reducedMotion: boolean;
  ripples: Ripple[];
};

const RippleButtonContext = React.createContext<RippleButtonContextValue | null>(
  null,
);

export type RippleButtonProps = HTMLMotionProps<"button"> & {
  hoverScale?: number;
  tapScale?: number;
};

export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  RippleButtonProps
>(function RippleButton(
  {
    children,
    disabled,
    hoverScale = 1.025,
    onClick,
    style,
    tapScale = 0.975,
    ...props
  },
  forwardedRef,
) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const [ripples, setRipples] = React.useState<Ripple[]>([]);
  const nextRippleId = React.useRef(0);
  const resetTimers = React.useRef<Set<ReturnType<typeof setTimeout>>>(
    new Set(),
  );

  React.useEffect(() => {
    const timers = resetTimers.current;

    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    if (!disabled && !shouldReduceMotion) {
      const rect = event.currentTarget.getBoundingClientRect();
      const isKeyboardClick = event.detail === 0;
      const x = isKeyboardClick ? rect.width / 2 : event.clientX - rect.left;
      const y = isKeyboardClick ? rect.height / 2 : event.clientY - rect.top;
      const id = nextRippleId.current;
      nextRippleId.current += 1;

      setRipples((current) => [...current, { id, x, y }]);

      const timer = setTimeout(() => {
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
        resetTimers.current.delete(timer);
      }, 600);
      resetTimers.current.add(timer);
    }

    onClick?.(event);
  }

  return (
    <RippleButtonContext.Provider
      value={{ reducedMotion: shouldReduceMotion, ripples }}
    >
      <motion.button
        {...props}
        ref={forwardedRef}
        data-slot="ripple-button"
        disabled={disabled}
        onClick={handleClick}
        style={{
          isolation: "isolate",
          overflow: "hidden",
          position: "relative",
          ...style,
        }}
        whileHover={
          shouldReduceMotion || disabled ? undefined : { scale: hoverScale }
        }
        whileTap={
          shouldReduceMotion || disabled ? undefined : { scale: tapScale }
        }
      >
        {children}
      </motion.button>
    </RippleButtonContext.Provider>
  );
});

RippleButton.displayName = "RippleButton";

export type RippleButtonRipplesProps = Omit<
  HTMLMotionProps<"span">,
  "children"
> & {
  color?: string;
  scale?: number;
  transition?: Transition;
};

export function RippleButtonRipples({
  color = "currentColor",
  scale = 10,
  style,
  transition = { duration: 0.6, ease: "easeOut" },
  ...props
}: RippleButtonRipplesProps) {
  const context = React.useContext(RippleButtonContext);

  if (!context) {
    throw new Error("RippleButtonRipples must be used inside RippleButton.");
  }

  if (context.reducedMotion) {
    return null;
  }

  return context.ripples.map((ripple) => (
    <motion.span
      {...props}
      key={ripple.id}
      aria-hidden="true"
      data-slot="ripple-button-ripple"
      initial={{ opacity: 0.28, scale: 0 }}
      animate={{ opacity: 0, scale }}
      transition={transition}
      style={{
        backgroundColor: color,
        borderRadius: "50%",
        height: 20,
        left: ripple.x - 10,
        pointerEvents: "none",
        position: "absolute",
        top: ripple.y - 10,
        width: 20,
        ...style,
      }}
    />
  ));
}
