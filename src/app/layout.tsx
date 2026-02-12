import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Royal Music — Create Music With AI",
  description:
    "Describe your song. Let AI produce it. Royal Music turns your words into studio-quality tracks in seconds.",
  keywords: ["ai music", "music generation", "ai composer", "royal music"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}
