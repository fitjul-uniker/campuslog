import Image from "next/image";
import Link from "next/link";

export default function CoverPage() {
  return (
    <section className="cover-scene" aria-labelledby="cover-title">
      <Link
        href="/dashboard"
        className="closed-notebook"
        aria-label="대시보드로 이동"
      >
        <Image
          className="notebook-cover-image"
          src="/black-leather-book.webp"
          alt="검은색 가죽 하드커버 기록장"
          width={1194}
          height={1878}
          sizes="(max-width: 640px) 244px, (max-width: 960px) 38vw, 365px"
          unoptimized
        />
        <h1 id="cover-title" className="notebook-title">
          CampusLog
        </h1>
        <div className="notebook-shadow" aria-hidden="true" />
      </Link>
    </section>
  );
}
