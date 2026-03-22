import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/context";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Family Recipes",
  description: "Our family recipe collection",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} min-h-screen bg-gray-50`}>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
