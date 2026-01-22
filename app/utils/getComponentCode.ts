export interface ComponentCodeArgs {
  id?: string;
  fileName: string;
  type: "ui" | "examples" | "configs" | "uniapp-components" | "uniapp-pages" | "uniapp-root" | "all";
}

const rawFiles = import.meta.glob<string>([
  "~/components/reborn/**/*.{vue,ts,js,d.ts}",
  "~/assets/**/*.{css,scss,json,ts,js,vue}",
  "@/../packages/uniapp-project/src/**/*.{vue,ts,js,css,json,scss}",
  "@/../packages/uniapp-project/*.{vue,ts,js,json,css,scss}",
  "!**/node_modules/**",
  "!**/.nuxt/**",
  "!**/dist/**",
  "!**/.output/**",
  "!**/nuxt.config.ts"
], {
  query: "?raw",
  import: "default",
});

export function getComponentCode(args: ComponentCodeArgs) {
  let normalizedSuffix = "";

  if (args.type === "ui" || args.type === "examples" || args.type === "configs") {
    normalizedSuffix = `/components/reborn/${args.type}/${args.id}/${args.fileName}`;
  } else if (args.type === "uniapp-components" && args.id) {
    normalizedSuffix = `/components/${args.id}/${args.fileName}`;
  } else if (args.type === "uniapp-pages" && args.id) {
    normalizedSuffix = `/pages/${args.id}/${args.fileName}`;
  } else if (args.type === "uniapp-root") {
    normalizedSuffix = `/packages/uniapp-project/${args.fileName}`;
  } else {
    // For type "all" or direct path matching
    normalizedSuffix = args.fileName.replaceAll("\\", "/");
    if (!normalizedSuffix.startsWith("/")) {
      normalizedSuffix = "/" + normalizedSuffix;
    }
  }

  const match = Object.entries(rawFiles).find(([path]) =>
    path.replaceAll("\\", "/").endsWith(normalizedSuffix),
  );

  return match?.[1];
}
