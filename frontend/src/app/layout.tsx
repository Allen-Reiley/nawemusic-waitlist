import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers"; // Import our new provider

export const metadata: Metadata = {
  title: "NaweMusic Waitlist",
  description: "Waitlist to a high value network for artists and their audience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}