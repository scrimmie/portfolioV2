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
      // Restrict to http(s) so a stray javascript:/data: URL can't reach an href.
      projectLink: z
        .string()
        .url()
        .refine((url) => /^https?:\/\//i.test(url), {
          message: "projectLink must be an http(s) URL",
        })
        .optional(),
    }),
});

export const collections = {
  projects: projectsCollection,
};
