import { Wrench, Car, Truck, Bike } from "lucide-react";

export function IconoPlataformaGrua({ className = "w-7 h-7" }) {
  return (
    <svg
      viewBox="0 0 64 28"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Plataforma (chasis largo) */}
      <path d="M2 20H60" />
      <path d="M2 20V10H8L12 16H14" />
      {/* Cabina del camión */}
      <path d="M2 16V10" />
      {/* Rampa trasera inclinada */}
      <path d="M60 20L58 15" />
      {/* Coche montado sobre la plataforma */}
      <path d="M20 20V16C20 14.8954 20.8954 14 22 14H40C41.1046 14 42 14.8954 42 16V20" />
      <path d="M24 14L27 9H36L38 14" />
      {/* Ruedas */}
      <circle cx="9" cy="21.5" r="2.2" />
      <circle cx="28" cy="21.5" r="2.2" />
      <circle cx="47" cy="21.5" r="2.2" />
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