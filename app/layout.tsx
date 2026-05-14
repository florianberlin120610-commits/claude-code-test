import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator Dashboard",
  description: "Decision Dashboard für Content Creator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body style={{ minHeight: "100vh" }}>{children}</body>
    </html>
  );
}
