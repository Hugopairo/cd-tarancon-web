import { defineConfig } from "astro/config";

// GitHub Pages: https://hugopairo.github.io/cd-tarancon-web/
// Con dominio propio: pon aquí site: "https://tudominio.es", borra `base` y añade public/CNAME.
export default defineConfig({
  site: "https://hugopairo.github.io",
  base: "/cd-tarancon-web",
  trailingSlash: "always",
});
