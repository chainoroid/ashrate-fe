import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ashrate Market",
  description:
    "Predict the bitcoin mining difficulty and bet against each other.",
  openGraph: {
    title: "Ashrate Market",
    description:
      "Predict the bitcoin mining difficulty and bet against each other.",
    images: [
      {
        url: "https://example.com/mock-og-image.png",
        alt: "Ashrate Market preview",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${vt323.variable} antialiased`}
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
