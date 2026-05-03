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
    "에이전트 루프를 역할·추정 비용과 함께 남기고, 제품 텔레메트리까지 한 타임라인에서 재현합니다. 워크스페이스·수집 API·공개 계약(/llms.txt)으로 운영 팀과 바로 공유하세요.",
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
