import { defineCollection, z } from 'astro:content';

const workCollection = defineCollection({
  type: 'content',
  schema: z.object({
    company: z.string(),
    role: z.string(),
    dateStart: z.string(),
    dateEnd: z.string(),
  }),
});

export const collections = {
  work: workCollection,
};
