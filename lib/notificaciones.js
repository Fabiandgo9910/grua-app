// Calcula qué grúas están dentro de la ventana de 7 días antes de su ITV.
// Se usa solo para pintar el aviso visual (banner) del dashboard;
// el aviso push real (sonido + notificación con la app cerrada) lo
// dispara el cron del servidor en app/api/check-itv/route.js.
export function alertasHoy(gruas) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return gruas.filter((g) => {
    if (!g.proximaItv) return false;
    const fechaItv = new Date(g.proximaItv);
    fechaItv.setHours(0, 0, 0, 0);
    const dias = Math.round((fechaItv - hoy) / (1000 * 60 * 60 * 24));
    return dias >= 0 && dias <= 7;
  });
}
