import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WickPopupScrollUnlock } from "@/components/WickPopupScrollUnlock";

export const metadata: Metadata = {
  title: "BI Stats",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col font-sans">
        <WickPopupScrollUnlock />
        {children}
      </body>
    </html>
  );
}
