import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Health Tracker",
    short_name: "Health",
    description: "Personal workout, nutrition and progress tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#12110f",
    theme_color: "#12110f",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["health", "fitness"],
    shortcuts: [
      {
        name: "Start workout",
        url: "/workouts",
        description: "Go to today's workout",
      },
      {
        name: "Log meal",
        url: "/nutrition/new",
        description: "Add a meal entry",
      },
    ],
  };
}
