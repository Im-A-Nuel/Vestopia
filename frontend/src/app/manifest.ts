import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vestopia",
    short_name: "Vestopia",
    description: "Build your village from your portfolio. A simulated investing game for beginners.",
    start_url: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#faf8f4",
    theme_color: "#3f6b30",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
