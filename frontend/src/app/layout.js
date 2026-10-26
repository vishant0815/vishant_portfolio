import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import MotionProvider from "@/components/MotionProvider";
import PageViewTracker from "@/components/PageViewTracker";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vishant Bhavsar · Python software developer",
    template: "%s · Vishant Bhavsar",
  },
  description:
    "Python software developer in London building backend services with Django REST Framework, FastAPI and PostgreSQL. MSc Big Data Technologies.",
  openGraph: { type: "website", siteName: "Vishant Bhavsar", locale: "en_GB" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Runs before the page paints, so there's never a flash of the wrong theme.
// Dark is the default; a saved choice wins.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":true;var r=document.documentElement;r.classList.toggle("dark",d);}catch(e){document.documentElement.classList.add("dark")}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB" className={`${plexSans.variable} ${plexMono.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col bg-bg text-text">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-panel focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
        <PageViewTracker />
      </body>
    </html>
  );
}
