import type { DefinedCollection } from "@nuxt/content";
import { defineCollection, defineContentConfig, z } from "@nuxt/content";
import { useNuxt } from "@nuxt/kit";
import { resolve } from "pathe";

const { options } = useNuxt();
const cwd = resolve(options.rootDir, "content");

const createDocsSchema = () =>
  z.object({
    category: z.string(),
    tags: z.array(z.string()),
    badge: z.enum(["New", "Updated"]).optional(),
    links: z
      .array(
        z.object({
          label: z.string(),
          icon: z.string(),
          to: z.string(),
          target: z.string().optional(),
        }),
      )
      .optional(),
  });

let collections: Record<string, DefinedCollection>;

collections = {
  landing: defineCollection({
    type: "page",
    source: {
      cwd,
      include: "index.md",
    },
  }),
  docs: defineCollection({
    type: "page",
    source: {
      cwd,
      include: "**/*.md",
      exclude: ["index.md"],
    },
    schema: createDocsSchema(),
  }),
};

export default defineContentConfig({ collections });
