import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PokePaka",
  description: "Sklep z kartami kolekcjonerskimi Pokémon i TCG.",
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
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
