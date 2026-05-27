import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LifeOS",
    short_name: "LifeOS",
    description: "나의 하루를 설계하고, 우리의 삶을 함께 관리하는 AI 비서",
    start_url: "/home",
    display: "standalone",
    background_color: "#FAF7FF",
    theme_color: "#B6A3EE",
    orientation: "portrait",
    categories: ["lifestyle", "health", "productivity"],
    lang: "ko",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
