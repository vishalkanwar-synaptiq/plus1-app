import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { PrototypeBar } from "@/components/PrototypeBar";
import "./globals.css";

// Lato is the only typeface (requirements section 9). Served from the app, not a third-party CDN.
const lato = localFont({
  src: [
    { path: "../../node_modules/lato-font/fonts/lato-normal/lato-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/lato-font/fonts/lato-medium/lato-medium.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/lato-font/fonts/lato-semibold/lato-semibold.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/lato-font/fonts/lato-bold/lato-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "plus1 · Guest lists",
  description: "Free guest-list spots from local venues. 21+ only.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0d14",
};

// Applies a saved theme before first paint. Dark is the default when nothing is saved.
const themeScript = `try{var t=localStorage.getItem("plus1.theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={lato.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <PrototypeBar />
        {children}
      </body>
    </html>
  );
}
