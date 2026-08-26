import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EJC Nossa Senhora Aparecida", template: "%s · EJC Aparecida" },
  description: "Encontro de Jovens com Cristo da Paróquia Nossa Senhora Aparecida, no Valentina.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
