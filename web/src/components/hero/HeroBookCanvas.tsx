"use client";

import { Suspense } from "react";
import type { MutableRefObject } from "react";
import { Canvas } from "@react-three/fiber";

import { BookModel } from "@/components/hero/BookModel";

type HeroBookCanvasProps = {
  onReady: () => void;
  pointer: MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
};

export function HeroBookCanvas({
  onReady,
  pointer,
  reducedMotion,
}: HeroBookCanvasProps) {
  return (
    <div className="hero-book-canvas">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0.05, 9.2], fov: 35, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        shadows
        fallback={null}
      >
        <ambientLight intensity={1.05} />
        <directionalLight
          position={[-4, 6, 6]}
          intensity={2.4}
          color="#fff8e8"
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[4, 1, -3]} intensity={1.15} color="#cfd8e5" />
        <pointLight position={[3.8, 4.2, 3]} intensity={12} distance={10} color="#fffaf0" />
        <Suspense fallback={null}>
          <BookModel
            onReady={onReady}
            pointer={pointer}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
