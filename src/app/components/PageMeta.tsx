import { useEffect } from "react";

const SITE_URL = "https://www.kfo-moosburg.de";

function upsertMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export function PageMeta({ title, description, path, noIndex = false }: {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
}) {
  useEffect(() => {
    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertMeta('meta[name="robots"]', "name", "robots", noIndex ? "noindex, nofollow, noarchive" : "index, follow");
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (noIndex || path === undefined) {
      canonical?.remove();
      document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.remove();
    } else {
      const link = canonical || document.createElement("link");
      link.rel = "canonical";
      link.href = `${SITE_URL}${path}`;
      if (!canonical) document.head.appendChild(link);
      upsertMeta('meta[property="og:url"]', "property", "og:url", link.href);
    }
  }, [description, noIndex, path, title]);

  return null;
}
