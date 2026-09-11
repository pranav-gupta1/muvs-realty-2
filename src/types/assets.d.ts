/**
 * Next injects declarations for `*.module.css` but not for plain side-effect
 * stylesheet imports, which is how the global stylesheet is loaded in
 * src/app/layout.tsx. TypeScript 5.6+ errors on those without a declaration.
 */
declare module '*.css'
