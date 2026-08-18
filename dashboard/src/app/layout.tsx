import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Credit Risk & Lending Portfolio Analytics",
  description: "An explainable portfolio analysis of payment difficulty, affordability, and prior lending outcomes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
