import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Video & Audio Transcriber",
  description: "Convert your media to text using OpenAI Whisper",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
