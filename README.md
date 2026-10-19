# Web del CD Tarancón

Web hecha con [Astro](https://astro.build) (estática, sin framework de interfaz). Web no oficial.
Publicada en https://hugopairo.github.io/cd-tarancon-web/

## Arrancar

```bash
npm install
npm run dev        # desarrollo en http://localhost:4321/cd-tarancon-web/
npm run build      # genera dist/
npm run preview    # sirve dist/
```

## Estructura

```
src/
  layouts/Base.astro        cabecera <head>, menú y pie comunes
  components/               Hero, NextMatch, Calendar, Standings, Squad, Club, Academy, Members, Nav, Footer
  pages/
    index.astro             portada (compone los componentes)
    noticias/               listado + detalle ([id].astro)
    tienda/                 catálogo de ejemplo (sin carrito)
    abonados/               maqueta de entrada (sin login)
  content/noticias/*.md     una noticia por archivo (colección en src/content.config.ts)
  data/                     data.json (automático), squad.json (jugadores), productos.json (tienda de ejemplo)
  lib/club.ts               lee data.json y calcula próximo partido, resultados, clasificación...
  lib/paths.ts              url("noticias/") → respeta el prefijo /cd-tarancon-web
  styles/                   tokens.css (colores/tipografías), global.css, pages.css
public/img/                 escudo
scripts/update-data.mjs     actualiza src/data/data.json desde BeSoccer
```

Todos los enlaces internos deben pasar por `url()` (`href={url("tienda/")}`), si no se rompen en GitHub Pages.

## Para el proyecto intermodular

Lo que está hecho y lo que falta, con `TODO` en el código donde engancharlo:

| Pieza | Estado | Dónde |
|---|---|---|
| Noticias | Funciona con archivos `.md`. Falta la hoja de noticias para abonados (noticias privadas). | `src/content/noticias/`, `src/pages/noticias/index.astro` |
| Tienda / carrito | Solo catálogo de ejemplo, botón deshabilitado. Falta carrito, pedido y pago. | `src/pages/tienda/index.astro`, `src/data/productos.json` |
| Abonados | Solo la maqueta de entrada. Falta registro, login, sesión y páginas privadas. | `src/pages/abonados/index.astro` |
| Alta de socios | El formulario valida pero no envía. | `src/components/Members.astro` |

Esta web es estática: para registro, login, pedidos y pagos hace falta un **backend** (API + base de datos) que la web llame con `fetch()`.
Cuando queráis interfaz reactiva (p. ej. el carrito) Astro permite añadir React, Vue o Svelte solo en esas piezas:
`npx astro add react` y usar el componente con `client:load`.

## Datos automáticos

`scripts/update-data.mjs` lee el calendario, resultados y clasificación de BeSoccer y escribe `src/data/data.json`.
El workflow `.github/workflows/actualizar.yml` lo ejecuta (cada hora en fin de semana, cada 6 h entre semana), guarda
`data.json` si cambió, recompila y publica en GitHub Pages.

**Limitación conocida:** BeSoccer bloquea (403) los servidores de GitHub, así que el paso automático falla y la web
sigue mostrando los últimos datos buenos. Mientras tanto, para actualizar a mano:

```bash
npm run update-data     # desde un PC normal
git add src/data/data.json && git commit -m "Datos actualizados" && git push
```

- Forzar una publicación: pestaña **Actions → Actualizar datos y publicar → Run workflow**.
- Si BeSoccer cambia su HTML, el script falla sin tocar `data.json`: habrá que ajustar `parseMatches` / `parseTable`.
- La lista de jugadores es manual: `src/data/squad.json`.
- Nueva temporada: `SEASON_START` en `scripts/update-data.mjs` y los textos de temporada en `src/components/Calendar.astro`.
