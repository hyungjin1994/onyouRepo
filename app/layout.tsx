import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";

import "./globals.css";
import { ServiceWorkerRegister } from "@/components/common/sw-register";

// Korean-friendly variable typeface served via next/font.
// Mapped onto the --font-pretendard variable used by the design system.
const koSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LifeOS",
  description: "나의 하루를 설계하고, 우리의 삶을 함께 관리하는 AI 비서",
  applicationName: "LifeOS",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAF7FF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${koSans.variable} h-full`}>
      <body className="min-h-dvh">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
