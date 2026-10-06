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

const DESCRIPTION = "Build your village from your portfolio. A simulated investing game for beginners.";

export const metadata: Metadata = {
  title: { default: "Vestopia", template: "%s | Vestopia" },
  description: DESCRIPTION,
  openGraph: { title: "Vestopia", description: DESCRIPTION, siteName: "Vestopia", type: "website" },
  twitter: { card: "summary", title: "Vestopia", description: DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${uiFont.variable} ${pixelFont.variable} h-full`}>
      <body className="min-h-full bg-default text-ink">
        {children}
        <Toaster position="bottom-right" offset={{ bottom: 72, right: 16 }} closeButton />
      </body>
    </html>
  );
}
