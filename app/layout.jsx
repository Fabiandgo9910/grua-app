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
      <body className="bg-gray-50 text-gray-900">
        <div className="pb-10">{children}</div>
        <footer className="fixed bottom-0 left-0 right-0 text-center text-[11px] text-gray-400 bg-gray-50/90 backdrop-blur-sm py-1.5 pointer-events-none select-none">
          © 2026 Asistencia del Toro · Sistema Interno · By Fabian D
        </footer>
      </body>
    </html>
  );
}
