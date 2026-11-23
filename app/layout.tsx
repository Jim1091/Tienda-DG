import type { Metadata } from "next";
import "./globals.css";
import "./dg.css";
import "./category-tiles.css";
import "./promotions.css";
import "./sourcing.css";
import "./catalog.css";
import "./menu.css";
import "./hero-products.css";
import "./live-schedule.css";
import "./account.css";
import "./brand.css";
import "./admin.css";

export const metadata: Metadata = {
  title: "Daniela y Garu | Moda para cada momento",
  description: "Prendas elegidas para vestir tu estilo. Compra con atención personalizada por WhatsApp.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg?v=2",
    shortcut: "/favicon.svg?v=2",
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
