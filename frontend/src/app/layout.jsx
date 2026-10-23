import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "@/context/AuthContext";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Gather — Learn • Connect • Grow",
  description: "Curated workshops, masterclasses, and gatherings for curious minds, practitioners, and creators.",
  keywords: ["gather", "events", "workshops", "masterclasses", "creative tech", "design", "gatherings"],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col font-sans bg-[#F7F4ED] text-[#171915] selection:bg-[#A9C3A0]/30 selection:text-[#073F2E] antialiased"
      >
        <AuthProvider>{children}</AuthProvider>
        {/* Razorpay Checkout Script */}
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
        {/* Google Identity Services */}
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
