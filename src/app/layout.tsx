import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/nav/site-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { NavGuard } from "@/components/nav/nav-guard";
import { DesktopSidebarServer } from "@/components/nav/desktop-sidebar-server";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PresenceHeartbeat } from "@/components/presence/presence-heartbeat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BIZI — Trade skills, not money",
  description: "A trust-based barter marketplace. Exchange services with people in your community.",
  applicationName: "BIZI",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "BIZI",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0814",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        {/* App-shell: this div is the sole flex container.
            h-dvh adjusts when the mobile browser URL bar appears/disappears.
            overflow-hidden clips nothing — it just prevents the div from
            growing beyond the viewport and pushing the nav off-screen. */}
        <ThemeProvider>
          <div className="flex h-dvh flex-col overflow-hidden">
            <ToastProvider>
              <PresenceHeartbeat />
              <NavGuard header={<SiteHeader />} bottom={<BottomNav />} sidebar={<DesktopSidebarServer />}>
                {children}
              </NavGuard>
            </ToastProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
