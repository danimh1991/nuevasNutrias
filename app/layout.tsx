import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nuevas nutrias · Crecimiento infantil",
  description: "Registra y consulta el crecimiento de tus pequeños.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
