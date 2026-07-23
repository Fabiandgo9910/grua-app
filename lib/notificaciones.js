// Calcula qué avisos (ITV y/o Tacógrafo) están dentro de la ventana de
// 7 días. Se usa solo para pintar el aviso visual (banner) del dashboard;
// el aviso push real (sonido + notificación con la app cerrada) lo
// dispara el cron del servidor en app/api/check-itv/route.js.
//
// Espera grúas con los campos: proximaItv y proximaTacografo (pueden ser null).
// Devuelve una lista plana de avisos (una grúa puede aparecer dos veces
// si tiene ambos próximos a la vez).
export function alertasHoy(gruas) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  function diasHasta(fecha) {
    if (!fecha) return null;
    const f = new Date(fecha);
    f.setHours(0, 0, 0, 0);
    return Math.round((f - hoy) / (1000 * 60 * 60 * 24));
  }

  const avisos = [];

  gruas.forEach((g) => {
    const diasItv = diasHasta(g.proximaItv);
    if (diasItv !== null && diasItv >= 0 && diasItv <= 7) {
      avisos.push({ id: `${g.id}-itv`, gruaId: g.id, matricula: g.matricula, marca: g.marca, tipo: "ITV", proximaFecha: g.proximaItv });
    }

    const diasTacografo = diasHasta(g.proximaTacografo);
    if (diasTacografo !== null && diasTacografo >= 0 && diasTacografo <= 7) {
      avisos.push({ id: `${g.id}-tacografo`, gruaId: g.id, matricula: g.matricula, marca: g.marca, tipo: "Tacógrafo", proximaFecha: g.proximaTacografo });
    }
  });

  return avisos;
}
