import "./globals.css";

export const metadata = {
  title: "Asistencia del Toro",
  description: "Control de flota, mantenimientos, roturas e ITV",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
          © 2026 Asistencia del Toro · Sistema Interno
          <div>By Fabian D</div>
        </footer>
      </body>
    </html>
  );
}
