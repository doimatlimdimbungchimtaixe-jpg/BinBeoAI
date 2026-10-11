import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-app-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BinBeoAI — Trợ lý AI tiếng Việt",
  description:
    "BinBeoAI là chatbot AI giúp bạn hỏi đáp, giải thích, viết lách và lập trình bằng tiếng Việt.",
};

/** Chống nháy theme: chạy trước khi React hydrate, đồng bộ với nori-theme. */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("nori-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${beVietnamPro.variable} min-h-full flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
