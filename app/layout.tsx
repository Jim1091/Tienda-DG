import type { Metadata } from "next";
import "./globals.css";
import "./dg.css";
import "./demo.css";
import "./promotions.css";

export const metadata: Metadata = {
  title: "DG | Moda para cada momento",
  description: "Prendas elegidas para vestir tu estilo. Compra con atención personalizada por WhatsApp.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
