import Link from "next/link";

import { HeroBook3D } from "@/components/hero/HeroBook3D";

export default function CoverPage() {
  return (
    <section className="cover-scene" aria-labelledby="cover-title">
      <Link
        href="/dashboard"
        className="closed-notebook"
        aria-label="대시보드로 이동"
      >
        <HeroBook3D />
        <h1 id="cover-title" className="sr-only">
          CampusLog
        </h1>
      </Link>
    </section>
  );
}
