import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: {
    default: "رحلتي | إدارة الرحلات والحجوزات",
    template: "%s | رحلتي",
  },
  description: "منصة إدارة رحلات وحجوزات شركة رحلتي",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
