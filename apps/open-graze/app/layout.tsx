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
  title: "OpenGraze — 역할별 에이전트 관측·워크스페이스",
  description:
    "기획·디자인·구현·테스트 역할을 한 타임라인에 남기고, 추정 토큰·비용과 제품 이벤트까지 같이 봅니다. 이메일 로그인, 수집 API, 공개 계약(/llms.txt)으로 정식 연동 경로를 제공하고, self-test는 선택 스모크로 둡니다.",
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
