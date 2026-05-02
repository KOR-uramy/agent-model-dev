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
  title: "OpenGraze",
  description:
    "Ralph·앱 텔레메트리 통합 뷰 · 워크스페이스 · Google 로그인 · API 수집",
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
