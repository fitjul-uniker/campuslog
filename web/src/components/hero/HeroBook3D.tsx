"use client";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { MathUtils } from "three";

const HeroBookCanvas = dynamic(
  () =>
    import("@/components/hero/HeroBookCanvas").then(
      (module) => module.HeroBookCanvas,
    ),
  { loading: () => null, ssr: false },
);

type CanvasErrorBoundaryProps = {
  children: ReactNode;
  onError: () => void;
};

type CanvasErrorBoundaryState = {
  hasError: boolean;
};

class CanvasErrorBoundary extends Component<
  CanvasErrorBoundaryProps,
  CanvasErrorBoundaryState
> {
  state: CanvasErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export function HeroBook3D() {
  const pointer = useRef({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const handleBookReady = useCallback(() => setIsReady(true), []);
  const handleCanvasError = useCallback(() => setIsReady(false), []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);

    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);

    return () => motionQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      pointer.current = { x: 0, y: 0 };
      return;
    }

    const updatePointer = (event: PointerEvent) => {
      pointer.current.x = MathUtils.clamp(
        (event.clientX / window.innerWidth) * 2 - 1,
        -1,
        1,
      );
      pointer.current.y = MathUtils.clamp(
        -(event.clientY / window.innerHeight) * 2 + 1,
        -1,
        1,
      );
    };

    const resetPointer = () => {
      pointer.current = { x: 0, y: 0 };
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("blur", resetPointer);

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("blur", resetPointer);
    };
  }, [reducedMotion]);

  return (
    <div
      className={`hero-book-visual${isReady ? " is-ready" : ""}`}
      aria-hidden="true"
    >
      <CanvasErrorBoundary onError={handleCanvasError}>
        <HeroBookCanvas
          onReady={handleBookReady}
          pointer={pointer}
          reducedMotion={reducedMotion}
        />
      </CanvasErrorBoundary>
    </div>
  );
}
