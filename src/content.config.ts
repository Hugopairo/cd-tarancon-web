import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Noticias: un archivo .md por noticia en src/content/noticias/.
// TODO (proyecto intermodular): si las noticias pasan a una base de datos, cambia el `loader`
// por uno propio que lea de vuestra API; las páginas no tendrían que cambiar.
const noticias = defineCollection({
  loader: glob({ base: "./src/content/noticias", pattern: "**/*.md" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = { noticias };
