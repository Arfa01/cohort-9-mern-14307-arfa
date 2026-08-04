# Frontend 

files ending in tsx can render interface elements
files ending in ts have logic, types, validation, config. 

## authentication

index.html runs =>
→ main.tsx starts React
→ AuthProvider checks who is signed in
→ App.tsx chooses the correct route
→ Login/Register/Dashboard page renders
→ auth.api.ts calls Express
→ Express sets/reads the HTTP-only cookie

| File or area | Responsibility |
|---|---|
| `src/api/client.ts` | Configures Axios and safely normalizes backend/network errors. |
| `src/api/auth.api.ts` | Contains only the four authentication API calls and their TypeScript types. |
| `src/validation/auth.schemas.ts` | Mirrors the backend's Zod validation for fast form feedback. |
| `src/auth/auth-context.ts` | Defines the authentication state and context contract. |
| `src/auth/AuthProvider.tsx` | Restores the session and owns login, registration, and logout state. |
| `src/auth/useAuth.ts` | Gives components safe access to the context. |
| `src/auth/RouteGuards.tsx` | Protects private pages and keeps signed-in users off auth pages. |
| `src/components/` | Holds reusable auth fields, layout, and logout button. |
| `src/pages/` | Holds login, registration, and the honest dashboard placeholder. |
| `src/test/` | Holds Jest setup and behavior-first authentication tests. |


## Run locally

Terminal 1, from `backend` folder:

```bash
npm run dev
```

Terminal 2, from `frontend` folder:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected Jest result: 1 suite and 9 tests passing.
