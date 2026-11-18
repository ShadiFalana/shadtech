import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShadTech — Technology That Works. Support You Can Trust.",
    short_name: "ShadTech",
    description: "Bilingual IT services and support platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F7F8FA",
    theme_color: "#F79432",
    lang: "en",
    dir: "ltr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
