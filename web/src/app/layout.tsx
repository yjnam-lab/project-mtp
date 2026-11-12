import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "파리 숙소 위치를 넣으면 반경 500m 미쉐린 별 식당으로 미식 입지 점수와 같은 조건 숙소의 적정가(추정치)를 보여 줍니다. 에어비앤비 호스트·투자자를 위한 입지 진단.";

export const metadata: Metadata = {
  metadataBase: new URL("https://project-mtp.vercel.app"),
  title: {
    default: "Paris Étoile — 파리 미식 입지 진단",
    template: "%s — Paris Étoile",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Paris Étoile",
    locale: "ko_KR",
    title: "Paris Étoile — Bien placé ?",
    description: "숙소의 가치, 주변의 별이 말해 줍니다. 파리 미쉐린 별 식당으로 보는 숙소 입지 진단.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={cn("h-full", "antialiased", geistMono.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}