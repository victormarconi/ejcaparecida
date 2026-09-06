import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://ejcaparecida.pdm1.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/termos", "/privacidade"],
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
