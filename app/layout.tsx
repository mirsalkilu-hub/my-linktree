import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "urlyu.com - Platform Shortener Link & Bio Landing Page",
  description: "Kelola tautan dan halaman bio modern Anda di urlyu.com",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        {children}
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