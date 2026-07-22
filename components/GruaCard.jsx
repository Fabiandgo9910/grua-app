import Link from "next/link";
import { ICONO_TIPO } from "@/components/icons";

export const TIPOS = {
  coche_taller: "Coche Taller",
  plataforma_ligera: "Plataforma Ligera",
  plataforma_pesada: "Plataforma Pesada",
  furgon_moto: "Furgón de Moto",
  patrol: "Patrol",
};

export default function GruaCard({ grua }) {
  const diasParaItv =
    grua.proximaItv != null
      ? Math.ceil((new Date(grua.proximaItv) - new Date()) / (1000 * 60 * 60 * 24))
      : null;
  const alertaItv = diasParaItv !== null && diasParaItv <= 7;
  const IconoTipo = ICONO_TIPO[grua.tipo];

  return (
    <Link
      href={`/gruas/${grua.id}`}
      className="block bg-white rounded-xl shadow hover:shadow-md transition p-5 border border-gray-100"
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-bold text-gray-800">{grua.matricula}</h2>
        <div className="flex items-center gap-2">
          {alertaItv && (
            <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
              ITV pronto
            </span>
          )}
          {IconoTipo && <IconoTipo className="w-10 h-10 text-gray-400" />}
        </div>
      </div>
      <p className="text-sm text-gray-500">
        {grua.marca}
        {grua.modelo ? ` ${grua.modelo}` : ""}
      </p>
      <p className="text-sm text-gray-500">{TIPOS[grua.tipo] || grua.tipo}</p>
      <p className="text-xs text-gray-400 mt-2">Código: {grua.codigo}</p>
      {grua.proximaItv && (
        <p className="text-xs mt-2 text-gray-500">
          Próxima ITV: {new Date(grua.proximaItv).toLocaleDateString("es-ES")}
        </p>
      )}
    </Link>
  );
}
