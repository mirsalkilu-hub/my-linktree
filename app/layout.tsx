import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "react-hot-toast";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "urlyu.com - Link Shortener & Bio Page Platform",
  description: "Create short links, bio pages, and QR codes, then track link engagement with urlyu.com.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PageTransition>{children}</PageTransition>
        <Analytics />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#0b1020",
              color: "#fff",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
            },
          }}
        />
      </body>
    </html>
  );
}