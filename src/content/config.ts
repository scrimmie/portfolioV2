import { z, defineCollection } from "astro:content";

const projectsCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    sortOrder: z.number(),
    logoImage: z.object({
      src: z.string(),
      alt: z.string(),
    }),
    images: z.array(
      z.object({
        src: z.string(),
        alt: z.string(),
      })
    ),
    language: z.enum(["en", "es"]),
    tags: z.array(z.string()),
    projectDate: z.string().transform((str) => new Date(str)),
    projectLink: z.string().url().optional(),
  }),
});

export const collections = {
  projects: projectsCollection,
};
