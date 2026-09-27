import { Geist, Geist_Mono } from "next/font/google";
import Nav from "./Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SSR 예제 — Next.js",
  description: "SSR vs CSR 비교 예제",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Nav />
        <main>{children}</main>
        <footer>CSR vs SSR 비교 예제 · Next.js</footer>
      </body>
    </html>
  );
}
