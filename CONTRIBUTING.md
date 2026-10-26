Thank you for your interest in contributing to the **Reborn UI** project! Your contributions help make this project better for everyone. Please take a moment to read through these guidelines to ensure a smooth collaboration.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Code of Conduct](#code-of-conduct)
3. [How to Contribute](#how-to-contribute)
   - [Reporting Bugs](#reporting-bugs)
   - [Suggesting Enhancements](#suggesting-enhancements)
   - [Adding New Components](#adding-new-components)
4. [Project Structure](#project-structure)
5. [Style Guidelines](#style-guidelines)
   - [Coding Standards](#coding-standards)
   - [Component Format](#component-format)
   - [Commit Messages](#commit-messages)
6. [Documentation Guidelines](#documentation-guidelines)
   - [Steps to Add a New Component](#steps-to-add-a-new-component)
7. [Testing](#testing)
8. [License](#license)

---

## Getting Started

- **Fork the Repository**: Create a personal fork of the project on GitHub.
- **Clone Your Fork**: Clone your forked repository to your local machine.
- **Create a Branch**: Create a new branch for your contribution (`git checkout -b feature/YourFeatureName`).
- **Install Dependencies**: Run `npm install` to install all necessary dependencies.

## Code of Conduct

By participating in this project, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md), which aims to foster an open and welcoming environment.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an [issue](https://github.com/unovue/reborn-ui/issues){:target="\_blank"} and include:

- A clear and descriptive title.
- Steps to reproduce the issue.
- Expected and actual results.
- Screenshots or code snippets, if applicable.

### Suggesting Enhancements

We welcome suggestions for new features or improvements. Please open an [issue](https://github.com/unovue/reborn-ui/issues){:target="\_blank"} and include:

- A clear and descriptive title.
- A detailed description of the enhancement.
- Any relevant examples or mockups.

### Adding New Components

We appreciate contributions that add new components to the library. Please ensure that:

- The component is generally useful and aligns with the project's goals.
- The component is compatible with both **Nuxt** and **Vue**.
- You follow the coding and documentation guidelines outlined below.
- You include unit tests for your component.

## Project Structure

Understanding the project structure is crucial for effective contribution:

- **Web components**: `app/components/reborn/ui/<component-folder-name>/` (component SFCs, `index.ts`, and the `*.config.ts` theme file).
- **UniApp components**: `packages/uniapp-project/src/components/<component-folder-name>/`. Components that exist on both platforms must keep their props, events, and slots aligned.
- **Web demos**: `app/components/reborn/examples/<component-folder-name>/` (`<Name>Demo.vue` and the `<Name>Overview.vue` thumbnail).
- **Playground configs**: `app/components/reborn/configs/<component-folder-name>/`.
- **UniApp demo pages**: `packages/uniapp-project/src/pages/<component-folder-name>/`.
- **Documentation**: `content/2.components/<category>/<component-folder-name>.md`.
- **Knowledge base overrides**: `knowledge/overrides/<component-folder-name>.json`.

## Style Guidelines

### Coding Standards

- **Language**: All components should be written in **Vue.js** with TypeScript support.
- **Styling**: Use **Tailwind CSS** classes for styling whenever possible.
- **Naming Conventions**: Use `PascalCase` for component names and filenames.

### Component Format

Your Vue components should adhere to the following structure:

```vue
<!-- Template -->
<template>
  <!-- Your template code goes here -->
</template>

<!-- Script -->
<script lang="ts" setup>
// Your script code goes here
</script>

<!-- Styles (if required) -->
<style scoped>
/* Your styles go here */
</style>
```

**Notes:**

- Use `<script lang="ts" setup>` for TypeScript and the Composition API.
- Keep styles scoped to prevent conflicts.
- Ensure compatibility with both **Nuxt** and **Vue**.

### Commit Messages

- Use the [Conventional Commits](https://www.conventionalcommits.org/) format.
- Begin with a type (`feat`, `fix`, `docs`, etc.) followed by a short description.
- Example: `feat: add TextHoverEffect component`

## Documentation Guidelines

Component documentation and demos follow the repository's authoring specs. Read them before writing a page; they are the single source of truth:

- **Component docs**: [docs/authoring/component-doc.md](docs/authoring/component-doc.md). The reference page is [content/2.components/button/reborn-button.md](content/2.components/button/reborn-button.md).
- **Component demos**: [docs/authoring/component-demo.md](docs/authoring/component-demo.md). The reference demo is [app/components/reborn/examples/reborn-button/RebornButtonDemo.vue](app/components/reborn/examples/reborn-button/RebornButtonDemo.vue).

### Steps to Add a New Component

1. **Create the component** in `app/components/reborn/ui/<component-folder-name>/` (and in `packages/uniapp-project/src/components/` when it also targets UniApp).
2. **Write the demo** `<Name>Demo.vue` in `app/components/reborn/examples/<component-folder-name>/`, plus an optional playground config in `app/components/reborn/configs/<component-folder-name>/`.
3. **Write the documentation** in `content/2.components/<category>/<component-folder-name>.md`. The page embeds the live preview and source code with `ComponentViewer`:

   ```md
   ::ComponentViewer{demoFile="RebornButtonDemo.vue" config="RebornButtonConfig" componentId="reborn-button" :componentFiles='["RebornButton.vue", "reborn-button.config.ts"]' :uniappFiles='["RebornButton.vue", "reborn-button.config.ts"]'}
   ::
   ```

   - `demoFile`: the demo SFC in `app/components/reborn/examples/<componentId>/`.
   - `config`: the playground config component, if any.
   - `componentId`: the component folder name.
   - `componentFiles` / `uniappFiles`: source files shown in the code tabs, relative to the Web and UniApp component folders. List only files that exist.

4. **Run the knowledge base check** (`pnpm kb:check`). API table rows must match the source member names exactly; CI enforces this.

## Testing

- **Unit Tests**: Write unit tests for your component if applicable.
- **Cross-Environment Testing**: Ensure that your component works correctly in both **Nuxt** and **Vue** environments.
- **Visual Testing**: Check the component visually to ensure it renders correctly.

## Additional Notes

- **Component Names**: Use `PascalCase` for component filenames and names.
- **Folder Names**: The component folder name (for example `reborn-button`) is shared by the component, demo, playground config, documentation file, and `componentId`.
- **Demo Components**: For each component, create a corresponding `<Name>Demo.vue` and place it in `app/components/reborn/examples/<component-folder-name>/`.
- **Localization**: If your component supports multiple languages, include details in the documentation.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](https://github.com/unovue/reborn-ui/blob/main/LICENSE){:target="\_blank"}.
