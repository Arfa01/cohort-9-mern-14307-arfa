# Notes frontend

The frontend is a React 19 and TypeScript single-page application built with Vite. It uses React Router for protected routes, React Hook Form and Zod for forms, Tailwind CSS for responsive styling, and Tiptap for rich-text notes.

## Main areas

| Area | Responsibility |
| --- | --- |
| `src/api` | Same-origin `/api` client and typed auth/Notes requests |
| `src/auth` | Session restoration, auth context, and route guards |
| `src/components` | Reusable auth fields, workspace header, note cards, and editor |
| `src/pages` | Login, registration, dashboard, and create/edit screens |
| `src/validation` | Client-side Zod schemas |
| `src/test` | Jest and Testing Library integration tests |

The interface includes responsive mobile-first layouts and explicit loading, empty, error/retry, not-found, saving, deleting, and validation states. The editor route is lazy-loaded so Tiptap does not enlarge the initial dashboard bundle.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
```

See the [root README](../README.md) for complete setup and the final SonarQube workflow.
