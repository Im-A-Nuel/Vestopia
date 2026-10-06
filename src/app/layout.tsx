import type { Metadata, Viewport } from "next";
import { Nunito, Press_Start_2P } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const uiFont = Nunito({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
});

const pixelFont = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vestopia",
  description: "Build your village from your portfolio. A simulated investing game for beginners.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${uiFont.variable} ${pixelFont.variable} h-full`}>
      <body className="min-h-full bg-default text-ink">
        {children}
        <Toaster position="bottom-center" closeButton />
      </body>
    </html>
  );
}
