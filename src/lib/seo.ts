import { useEffect } from "react";

export function useSeo({
  title,
  description,
  canonicalPath,
}: {
  title: string;
  description: string;
  canonicalPath: string;
}) {
  useEffect(() => {
    document.title = title;

    const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (meta) meta.content = description;

    const canonical = document.getElementById("canonical-link") as HTMLLinkElement | null;
    if (canonical) canonical.href = canonicalPath;
  }, [canonicalPath, description, title]);
}
