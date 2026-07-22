import "./globals.css";

export const metadata = {
  title: "Asistencia del Toro",
  description: "Control de flota, mantenimientos, roturas e ITV",
  manifest: "/manifest.json",
  // --- CONFIGURACIÓN DE ICONOS ---
  icons: {
    // Icono estándar (Favicon)
    icon: [
      { url: "/favicon.png", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    // Icono para accesos directos en iOS (iPhone / iPad)
    apple: [
      { url: "/icon-192.png", sizes: "180x180", type: "image/png" },
    ],
    // Icono para pestañas fijadas en Safari
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#2563eb",
      },
    ],
  },
  // Metadatos adicionales para dispositivos Apple
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Asistencia del Toro",
  },
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