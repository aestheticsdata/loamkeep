/// <reference types="vite/client" />

// Only for `import.meta.env.DEV` in main.ts, which gates the demo harness's
// window onto the game. Vite replaces it at build time, so the production
// bundle has no branch and no property — but TypeScript still needs to be
// told the shape of `import.meta.env`.
