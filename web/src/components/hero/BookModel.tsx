"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import { RoundedBox, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  Group,
  LinearFilter,
  MathUtils,
  MeshStandardMaterial,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  Sprite,
} from "three";

type BookModelProps = {
  onReady: () => void;
  pointer: MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
};

const BASE_ROTATION = {
  x: MathUtils.degToRad(-5),
  y: MathUtils.degToRad(-18),
  z: MathUtils.degToRad(-3),
};

const COVER_WIDTH = 3.2;
const COVER_HEIGHT = 5.08;
const COVER_DEPTH = 0.13;
const SURFACE_WIDTH = 3.12;
const SURFACE_HEIGHT = 5;
const SURFACE_RADIUS = 0.07;

function createRoundedSurfaceGeometry() {
  const halfWidth = SURFACE_WIDTH / 2;
  const halfHeight = SURFACE_HEIGHT / 2;
  const shape = new Shape();

  shape.moveTo(-halfWidth + SURFACE_RADIUS, -halfHeight);
  shape.lineTo(halfWidth - SURFACE_RADIUS, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + SURFACE_RADIUS);
  shape.lineTo(halfWidth, halfHeight - SURFACE_RADIUS);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - SURFACE_RADIUS, halfHeight);
  shape.lineTo(-halfWidth + SURFACE_RADIUS, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - SURFACE_RADIUS);
  shape.lineTo(-halfWidth, -halfHeight + SURFACE_RADIUS);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + SURFACE_RADIUS, -halfHeight);

  const geometry = new ShapeGeometry(shape, 8);
  const positions = geometry.getAttribute("position");
  const uvs = geometry.getAttribute("uv");

  for (let index = 0; index < positions.count; index += 1) {
    uvs.setXY(
      index,
      (positions.getX(index) + halfWidth) / SURFACE_WIDTH,
      (positions.getY(index) + halfHeight) / SURFACE_HEIGHT,
    );
  }

  uvs.needsUpdate = true;
  return geometry;
}

function useCoverTitleTexture() {
  const [titleTexture, setTitleTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '500 116px Georgia, "Times New Roman", serif';
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "rgba(202, 198, 184, 0.32)";
    context.fillText("CampusLog", canvas.width / 2, canvas.height / 2 + 4);

    context.shadowColor = "rgba(0, 0, 0, 0.72)";
    context.shadowBlur = 5;
    context.shadowOffsetY = 3;
    context.fillStyle = "rgba(15, 15, 13, 0.78)";
    context.fillText("CampusLog", canvas.width / 2, canvas.height / 2);

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.colorSpace = SRGBColorSpace;
    nextTexture.minFilter = LinearFilter;
    nextTexture.magFilter = LinearFilter;
    nextTexture.needsUpdate = true;
    setTitleTexture(nextTexture);

    return () => nextTexture.dispose();
  }, []);

  return titleTexture;
}

function useBookShadowTexture() {
  const [shadowTexture, setShadowTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.save();
    context.translate(256, 64);
    context.scale(1, 0.23);

    const gradient = context.createRadialGradient(0, 0, 8, 0, 0, 250);
    gradient.addColorStop(0, "rgba(19, 18, 16, 0.5)");
    gradient.addColorStop(0.36, "rgba(19, 18, 16, 0.3)");
    gradient.addColorStop(0.72, "rgba(19, 18, 16, 0.08)");
    gradient.addColorStop(1, "rgba(19, 18, 16, 0)");
    context.fillStyle = gradient;
    context.fillRect(-256, -280, 512, 560);
    context.restore();

    const nextTexture = new CanvasTexture(canvas);
    nextTexture.minFilter = LinearFilter;
    nextTexture.magFilter = LinearFilter;
    nextTexture.needsUpdate = true;
    setShadowTexture(nextTexture);

    return () => nextTexture.dispose();
  }, []);

  return shadowTexture;
}

export function BookModel({
  onReady,
  pointer,
  reducedMotion,
}: BookModelProps) {
  const bookRef = useRef<Group>(null);
  const softShadowRef = useRef<Sprite>(null);
  const contactShadowRef = useRef<Sprite>(null);
  const entryProgress = useRef(reducedMotion ? 1 : 0);
  const texture = useTexture("/black-leather-book.webp");
  const titleTexture = useCoverTitleTexture();
  const shadowTexture = useBookShadowTexture();
  const frontSurfaceGeometry = useMemo(() => createRoundedSurfaceGeometry(), []);
  const { gl } = useThree();

  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.repeat.set(0.82, 0.92);
  texture.offset.set(0.13, 0.04);

  useEffect(() => {
    onReady();
  }, [onReady, texture]);

  const coverMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#11110f"),
        roughness: 0.84,
        metalness: 0.02,
      }),
    [],
  );

  const paperMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#ddd8c9"),
        roughness: 0.96,
        metalness: 0,
      }),
    [],
  );

  useFrame((state, delta) => {
    const book = bookRef.current;
    if (!book) return;

    entryProgress.current = MathUtils.damp(
      entryProgress.current,
      1,
      reducedMotion ? 16 : 3.6,
      delta,
    );

    const entry = entryProgress.current;
    const pointerStrength = reducedMotion ? 0 : 1;
    const targetRotationX =
      BASE_ROTATION.x +
      pointer.current.y * MathUtils.degToRad(3) * pointerStrength +
      (1 - entry) * MathUtils.degToRad(8);
    const targetRotationY =
      BASE_ROTATION.y +
      pointer.current.x * MathUtils.degToRad(6) * pointerStrength +
      (1 - entry) * MathUtils.degToRad(-12);
    const targetRotationZ =
      BASE_ROTATION.z + (1 - entry) * MathUtils.degToRad(-3);

    book.rotation.x = MathUtils.damp(book.rotation.x, targetRotationX, 5, delta);
    book.rotation.y = MathUtils.damp(book.rotation.y, targetRotationY, 5, delta);
    book.rotation.z = MathUtils.damp(book.rotation.z, targetRotationZ, 5, delta);

    const floatingOffset = reducedMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * ((Math.PI * 2) / 5.2)) * 0.07;
    book.position.y = MathUtils.damp(
      book.position.y,
      floatingOffset - (1 - entry) * 0.38,
      4,
      delta,
    );

    const targetScale = 0.92 + entry * 0.08;
    const nextScale = MathUtils.damp(book.scale.x, targetScale, 7, delta);
    book.scale.setScalar(nextScale);

    const softShadow = softShadowRef.current;
    const contactShadow = contactShadowRef.current;
    if (softShadow && contactShadow) {
      const normalizedLift = MathUtils.clamp((book.position.y + 0.08) / 0.16, 0, 1);
      const rotationDelta = book.rotation.y - BASE_ROTATION.y;

      softShadow.position.x = MathUtils.damp(
        softShadow.position.x,
        -0.22 + rotationDelta * -1.15,
        5,
        delta,
      );
      softShadow.position.y = MathUtils.damp(
        softShadow.position.y,
        -2.8 + book.position.y * 0.06,
        5,
        delta,
      );
      softShadow.scale.x = MathUtils.damp(
        softShadow.scale.x,
        2.72 + normalizedLift * 0.3 + Math.abs(rotationDelta) * 0.7,
        5,
        delta,
      );
      softShadow.scale.y = MathUtils.damp(
        softShadow.scale.y,
        0.4 + normalizedLift * 0.1,
        5,
        delta,
      );
      softShadow.material.opacity = MathUtils.damp(
        softShadow.material.opacity,
        0.44 - normalizedLift * 0.12 - Math.abs(rotationDelta) * 0.08,
        5,
        delta,
      );

      contactShadow.position.x = MathUtils.damp(
        contactShadow.position.x,
        -0.1 + rotationDelta * -1.5,
        6,
        delta,
      );
      contactShadow.position.y = MathUtils.damp(
        contactShadow.position.y,
        -2.71 + book.position.y * 0.03,
        6,
        delta,
      );
      contactShadow.scale.x = MathUtils.damp(
        contactShadow.scale.x,
        1.58 + normalizedLift * 0.2 + Math.abs(rotationDelta) * 0.42,
        6,
        delta,
      );
      contactShadow.scale.y = MathUtils.damp(
        contactShadow.scale.y,
        0.2 + normalizedLift * 0.06,
        6,
        delta,
      );
      contactShadow.material.opacity = MathUtils.damp(
        contactShadow.material.opacity,
        0.72 - normalizedLift * 0.24 - Math.abs(rotationDelta) * 0.12,
        5,
        delta,
      );
    }

    const decay = Math.exp(-delta * 0.42);
    pointer.current.x *= decay;
    pointer.current.y *= decay;
  });

  return (
    <>
      <group ref={bookRef} rotation={[BASE_ROTATION.x, BASE_ROTATION.y, BASE_ROTATION.z]}>
        <RoundedBox
          args={[COVER_WIDTH, COVER_HEIGHT, COVER_DEPTH]}
          radius={0.075}
          smoothness={3}
          position={[0, 0, 0.255]}
          material={coverMaterial}
          castShadow
        />

        <RoundedBox
          args={[COVER_WIDTH, COVER_HEIGHT, COVER_DEPTH]}
          radius={0.075}
          smoothness={3}
          position={[0, 0, -0.255]}
          material={coverMaterial}
          castShadow
        />

        <RoundedBox
          args={[2.98, 4.82, 0.41]}
          radius={0.045}
          smoothness={2}
          position={[0.07, 0, 0]}
          material={paperMaterial}
          castShadow
          receiveShadow
        />

        <mesh position={[-1.58, 0, 0]} castShadow material={coverMaterial}>
          <cylinderGeometry args={[0.255, 0.255, 4.98, 20, 1]} />
        </mesh>

        <mesh
          geometry={frontSurfaceGeometry}
          position={[0, 0, 0.327]}
          castShadow
        >
          <meshStandardMaterial
            map={texture}
            roughness={0.82}
            metalness={0.01}
          />
        </mesh>

        {titleTexture ? (
          <mesh position={[0.12, 1.62, 0.335]}>
            <planeGeometry args={[2.16, 0.54]} />
            <meshBasicMaterial
              map={titleTexture}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        ) : null}

        {[-0.15, -0.04, 0.07, 0.18].map((z) => (
          <mesh key={z} position={[1.565, -0.02, z]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.015, 4.65]} />
            <meshBasicMaterial color="#aaa596" transparent opacity={0.48} />
          </mesh>
        ))}
      </group>

      {shadowTexture ? (
        <>
          <sprite
            ref={softShadowRef}
            position={[-0.22, -2.8, -0.65]}
            scale={[2.72, 0.4, 1]}
          >
            <spriteMaterial
              map={shadowTexture}
              transparent
              depthWrite={false}
              opacity={0.4}
              toneMapped={false}
            />
          </sprite>
          <sprite
            ref={contactShadowRef}
            position={[-0.1, -2.71, -0.5]}
            scale={[1.58, 0.2, 1]}
          >
            <spriteMaterial
              map={shadowTexture}
              transparent
              depthWrite={false}
              opacity={0.62}
              toneMapped={false}
            />
          </sprite>
        </>
      ) : null}
    </>
  );
}
