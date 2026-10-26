import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SpendSense — A little clarity. A lot more possibility.",
  description:
    "Your everyday money companion. Track spending, build better habits, and make room for what matters.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
