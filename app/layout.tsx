import type { Metadata } from "next";
import ScrollToTop from "./components/ScrollToTop";
import BottomTabBar from "./components/BottomTabBar";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  weight: ['400', '500', '600', '700', '800'],
  subsets: ["latin"],
  display: 'swap',
  variable: "--font-noto-sans-tc",
});

export const metadata: Metadata = {
  title: "寵物專科診所搜尋 | 台北",
  description: "描述症狀，找到台北最合適的專科動物醫院",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${notoSansTC.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<ScrollToTop /><BottomTabBar /></body>
    </html>
  );
}
