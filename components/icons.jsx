import { Wrench, Car, Truck, Bike } from "lucide-react";

export function IconoPlataformaGrua({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 48 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cabina de la grúa */}
      <path
        d="M2 22V13C2 12.4477 2.44772 12 3 12H10L14 18H2Z"
        fill="currentColor"
      />
      {/* Plataforma trasera */}
      <rect x="13" y="16" width="30" height="4" rx="1" fill="currentColor" />
      {/* Rampa trasera */}
      <path d="M43 16L46 20H43V16Z" fill="currentColor" />
      {/* Coche cargado encima de la plataforma */}
      <path
        d="M22 15.5C22 14.6716 22.6716 14 23.5 14H33.5C34.3284 14 35 14.6716 35 15.5V16H22V15.5Z"
        fill="currentColor"
      />
      <path
        d="M24 11C24 10.4477 24.4477 10 25 10H31.5C32.0523 10 32.5 10.4477 32.5 11V14H24V11Z"
        fill="currentColor"
      />
      {/* Ruedas */}
      <circle cx="7" cy="22" r="3" fill="currentColor" />
      <circle cx="30" cy="22" r="3" fill="currentColor" />
      <circle cx="39" cy="22" r="3" fill="currentColor" />
    </svg>
  );
}

// Icono pequeño por cada tipo de vehículo, para las tarjetas del listado.
export const ICONO_TIPO = {
  coche_taller: Wrench,
  plataforma_ligera: Car,
  plataforma_pesada: Truck,
  furgon_moto: Bike,
};
