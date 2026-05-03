import type { Metadata } from "next";
import { Geist_Mono, Outfit, Source_Serif_4 } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenGraze — 에이전트·제품 관측",
  description:
    "다중 에이전트 실행을 역할별로 타임라인에 남기고, 워크스페이스·수집 API로 제품 이벤트까지 한 화면에서 재현합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${outfit.variable} ${sourceSerif.variable} ${geistMono.variable} ${outfit.className} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
