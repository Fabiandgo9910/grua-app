import Image from "next/image";

// Map de rutas a tus imágenes locales situadas en /public/iconos/
const RUTAS_ICONOS = {
  coche_taller: "/iconos/coche-taller.png",
  plataforma_ligera: "/iconos/plataforma-ligera.png",
  plataforma_pesada: "/iconos/plataforma-pesada.png",
  furgon_moto: "/iconos/furgon-motos.png",
  patrol: "/iconos/patrol.png",
};

// Componente genérico para renderizar el icono local con fallback
export function IconoLocal({ tipo, className = "w-12 h-12", alt = "Icono" }) {
  const ruta = RUTAS_ICONOS[tipo] || RUTAS_ICONOS.coche_taller;

  return (
    <img
      src={ruta}
      alt={alt}
      className={`object-contain inline-block ${className}`}
    />
  );
}

// Icono principal de cabecera
export function IconoPlataformaGrua({ className = "w-12 h-12" }) {
  return (
    <img
      src="/iconos/plataforma-ligera.png"
      alt="Asistencia del Toro"
      className={`object-contain ${className}`}
    />
  );
}

// Mapeo dinámico para las tarjetas (GruaCard)
export const ICONO_TIPO = {
  coche_taller: (props) => <IconoLocal tipo="coche_taller" {...props} />,
  plataforma_ligera: (props) => <IconoLocal tipo="plataforma_ligera" {...props} />,
  plataforma_pesada: (props) => <IconoLocal tipo="plataforma_pesada" {...props} />,
  furgon_moto: (props) => <IconoLocal tipo="furgon_moto" {...props} />,
  patrol: (props) => <IconoLocal tipo="patrol" {...props} />,
};