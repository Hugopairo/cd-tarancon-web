// Rutas con el prefijo de despliegue (`base` en astro.config.mjs).
// Úsalo en todos los enlaces internos: href={url("noticias/")}  →  /cd-tarancon-web/noticias/
const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const url = (path = "") => `${base}/${path.replace(/^\//, "")}`;
