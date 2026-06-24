import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/nav/site-header";
import { BottomNav } from "@/components/nav/bottom-nav";
import { NavGuard } from "@/components/nav/nav-guard";
import { ToastProvider } from "@/components/ui/toast";
import { PresenceHeartbeat } from "@/components/presence/presence-heartbeat";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BIZI — Trade skills, not money",
  description: "A trust-based barter marketplace. Exchange services with people in your community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-background text-foreground">
        {/* App-shell: this div is the sole flex container.
            h-dvh adjusts when the mobile browser URL bar appears/disappears.
            overflow-hidden clips nothing — it just prevents the div from
            growing beyond the viewport and pushing the nav off-screen. */}
        <div className="flex h-dvh flex-col overflow-hidden">
          <ToastProvider>
            <PresenceHeartbeat />
            <NavGuard header={<SiteHeader />} bottom={<BottomNav />}>
              {children}
            </NavGuard>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}
