import type { MetadataRoute } from "next";
import { SITE } from "./layout";
import { CATALOG } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...CATALOG.map((e) => ({
      url: `${SITE}/docs/${e.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
