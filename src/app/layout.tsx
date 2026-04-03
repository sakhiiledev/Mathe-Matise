import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Mathe-Matise | Learning Made Easier",
    template: "%s | Mathe-Matise",
  },
  description:
    "A professional LMS for Mathematics and Physical Sciences — Grades 8–12, aligned to the South African CAPS curriculum.",
  keywords: ["mathematics", "physical sciences", "CAPS", "tutoring", "Grade 8-12", "South Africa"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </Providers>
      </body>
    </html>
  );
}
