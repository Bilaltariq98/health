import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { NavBar } from "@/components/nav-bar";
import { SWRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "Health",
  description: "Personal health tracker — workouts, nutrition, progress.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Health" },
};

export const viewport: Viewport = {
  themeColor: "#12110f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <main className="pb-nav min-h-screen">{children}</main>
          <NavBar />
          <SWRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
