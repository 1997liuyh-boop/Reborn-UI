# RebornImage State Handling Refactor

## Problem
`vue-lazyload` manages image loading internally. When an image fails, it sets the `lazy="error"` attribute on the `img` element but does not necessarily bubble a standard `@error` event to the Vue component, causing `isError` state to remain `false`.

## Solution
Use CSS-based state control via Tailwind's `peer` utility for `v-lazy`, while maintaining JS-based control for standard loading.

### Changes
1.  **Reorder DOM**: Move `<img>` to the beginning of the container so it can be a `peer` to the overlays.
2.  **Add `peer` class**: Add `peer` to both standard and lazy `img` tags.
3.  **Update Overlays**:
    -   Change `v-if` to `v-show` or class binding to keep elements in DOM (required for peer).
    -   Add Tailwind peer modifiers:
        -   Error Overlay: `peer-[lazy=error]:flex` (and ensure it's hidden by default/controlled by `isError`).
        -   Loading Overlay: `peer-[lazy=loading]:flex` (and controlled by `isLoading`).
4.  **Compatibility**: Ensure `isError`/`isLoading` refs still work for non-lazy mode.

## Implementation Details
-   `img` tag needs `z-0` or similar? Default stacking: later siblings on top. So `img` first is perfect for `absolute` overlays on top.
-   Error Overlay Class: `hidden peer-[lazy=error]:flex` (if relying purely on CSS for lazy) + `flex` if `isError` is true.
    -   Combined: `cn(..., { 'flex': isError, 'hidden': !isError && !lazyLoad, 'peer-[lazy=error]:flex': lazyLoad })`
    -   Simplest: Always render, default hidden. Show if `isError` OR `peer-lazy=error`.
    -   Class: `absolute ... hidden peer-[lazy=error]:flex` ?
    -   Vue logic: `:class="{ '!flex': isError }"` (using `!` to override hidden).

### Plan
1.  Move `img` tags to top of `div`.
2.  Add `peer` to `img`.
3.  Update `error` and `loading` divs to use peer classes.
