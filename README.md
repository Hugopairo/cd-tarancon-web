# Web del CD Tarancón

Web estática (HTML + CSS + JS, sin dependencias). Web no oficial.

## Datos automáticos

`scripts/update-data.mjs` lee el calendario, los resultados y la clasificación de BeSoccer y escribe `data.json`.
El workflow `.github/workflows/actualizar.yml` lo ejecuta solo (cada hora en fin de semana, cada 6 h entre semana),
guarda `data.json` si ha cambiado y vuelve a publicar la web en GitHub Pages.

- Probar en local: `node scripts/update-data.mjs` y servir la carpeta (`npx serve .`).
- Forzar una actualización: pestaña **Actions → Actualizar datos y publicar → Run workflow**.
- Si BeSoccer cambia su HTML, el script falla sin tocar `data.json` y la web sigue mostrando los últimos datos buenos.
  Habrá que ajustar `parseMatches` / `parseTable`.
- La plantilla de jugadores es manual: edita `SQUAD` en `script.js`.
- Para cambiar de temporada: `SEASON_START` en `scripts/update-data.mjs` y los textos de temporada en `index.html`.
