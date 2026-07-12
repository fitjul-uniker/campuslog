import type { RelatedLink } from "@/lib/types";

export const MAX_RELATED_LINKS = 10;
export const MAX_RELATED_LINK_URL_LENGTH = 2_048;
export const MAX_RELATED_LINK_DESCRIPTION_LENGTH = 120;

const PRIVATE_HOST_SUFFIXES = [
  ".local",
  ".internal",
  ".lan",
  ".test",
  ".localhost",
];

function addDefaultProtocol(value: string): string | null {
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) {
    return value;
  }

  const authority = value.split(/[/?#]/, 1)[0];

  if (!authority || /\s|@/.test(authority)) {
    return null;
  }

  const hostname = authority.startsWith("[")
    ? authority.slice(1, authority.indexOf("]"))
    : authority.replace(/:\d+$/, "");
  const isDomainLike =
    hostname === "localhost" ||
    hostname.includes(".") ||
    /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) ||
    hostname.includes(":");

  return isDomainLike ? `https://${value}` : null;
}

export function normalizeRelatedLinkUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue || trimmedValue.length > MAX_RELATED_LINK_URL_LENGTH) {
    return null;
  }

  try {
    const valueWithProtocol = addDefaultProtocol(trimmedValue);

    if (!valueWithProtocol) {
      return null;
    }

    const parsedUrl = new URL(valueWithProtocol);

    if (
      (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
      parsedUrl.username ||
      parsedUrl.password ||
      !parsedUrl.hostname
    ) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function parseRelatedLinks(value: unknown): RelatedLink[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .flatMap<RelatedLink>((item) => {
      if (typeof item === "string") {
        const url = item.trim();

        return url ? [{ url, description: "" }] : [];
      }

      if (!item || typeof item !== "object") {
        return [];
      }

      const candidate = item as Record<string, unknown>;

      if (
        typeof candidate.url !== "string" ||
        (candidate.description !== undefined &&
          typeof candidate.description !== "string")
      ) {
        return [];
      }

      const url = candidate.url.trim();

      return url
        ? [
            {
              url,
              description:
                typeof candidate.description === "string"
                  ? candidate.description.trim()
                  : "",
            },
          ]
        : [];
    });
}

export function normalizeRelatedLinksForStorage(
  links: RelatedLink[],
): RelatedLink[] {
  return links
    .flatMap<RelatedLink>((link) => {
      const trimmedUrl = link.url.trim();

      if (!trimmedUrl) {
        return [];
      }

      return [
        {
          url: normalizeRelatedLinkUrl(trimmedUrl) ?? trimmedUrl,
          description: link.description.trim(),
        },
      ];
    });
}

export function getRelatedLinkHostname(value: string): string {
  const normalizedUrl = normalizeRelatedLinkUrl(value);

  if (!normalizedUrl) {
    return "";
  }

  return new URL(normalizedUrl).hostname.replace(/^www\./i, "");
}

function isPrivateHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  if (
    normalizedHostname === "localhost" ||
    PRIVATE_HOST_SUFFIXES.some((suffix) => normalizedHostname.endsWith(suffix))
  ) {
    return true;
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalizedHostname)) {
    return true;
  }

  return normalizedHostname.includes(":");
}

export function getRelatedLinkFaviconUrl(value: string): string | null {
  const normalizedUrl = normalizeRelatedLinkUrl(value);

  if (!normalizedUrl) {
    return null;
  }

  const hostname = new URL(normalizedUrl).hostname;

  if (!hostname.includes(".") || isPrivateHostname(hostname)) {
    return null;
  }

  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    hostname,
  )}&sz=64`;
}
