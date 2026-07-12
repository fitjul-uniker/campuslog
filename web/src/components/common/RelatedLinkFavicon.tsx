"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";

import { getRelatedLinkFaviconUrl } from "@/lib/relatedLinks";

type RelatedLinkFaviconProps = {
  url: string;
};

function FaviconImage({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Link2 aria-hidden="true" />;
  }

  return (
    // Dynamic favicons come from one fixed provider, so Next image optimization is unnecessary.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      referrerPolicy="no-referrer"
      aria-hidden="true"
      onError={() => setHasError(true)}
    />
  );
}

export function RelatedLinkFavicon({ url }: RelatedLinkFaviconProps) {
  const faviconUrl = getRelatedLinkFaviconUrl(url);

  return (
    <span className="related-link-favicon" aria-hidden="true">
      {faviconUrl ? (
        <FaviconImage key={faviconUrl} src={faviconUrl} />
      ) : (
        <Link2 aria-hidden="true" />
      )}
    </span>
  );
}
