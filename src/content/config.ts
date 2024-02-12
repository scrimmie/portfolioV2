import { z, defineCollection } from "astro:content";

const projectsCollection = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      sortOrder: z.number(),
      logoImage: image(),
      images: z.array(image()),
      projectDate: z.string().transform((str) => new Date(str)),
      projectLink: z.string().url().optional(),
    }),
});

export const collections = {
  projects: projectsCollection,
};
