import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url))
        }
    },
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "apple-touch-icon.svg"],
            manifest: {
                name: "Docházka a výdělky",
                short_name: "Docházka",
                description: "Osobní evidence pracovní docházky a výdělků",
                theme_color: "#f5f8fc",
                background_color: "#f5f8fc",
                display: "standalone",
                start_url: "/",
                scope: "/",
                lang: "cs",
                icons: [
                    {
                        src: "pwa-192x192.svg",
                        sizes: "192x192",
                        type: "image/svg+xml",
                        purpose: "any maskable"
                    },
                    {
                        src: "pwa-512x512.svg",
                        sizes: "512x512",
                        type: "image/svg+xml",
                        purpose: "any maskable"
                    }
                ]
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,json}"],
                navigateFallback: "index.html"
            }
        })
    ],
    server: { port: 5173 },
    preview: { port: 4173 }
});
