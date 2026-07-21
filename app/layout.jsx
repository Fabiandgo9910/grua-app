import "./globals.css";

export const metadata = {
  title: "Gestión de Grúas",
  description: "Control de flota, mantenimientos, roturas e ITV",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
