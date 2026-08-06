# Notes API

The backend is an Express 5 and TypeScript API backed by MongoDB and Mongoose. It provides authentication, owner-scoped Notes CRUD, health probes, structured errors, and request-correlated Pino logging.

## Layers

| Directory | Responsibility |
| --- | --- |
| `src/routes` | Map HTTP methods and paths to middleware and controllers |
| `src/controllers` | Translate requests into service calls and responses |
| `src/services` | Apply authentication and Notes business rules |
| `src/models` | Define MongoDB documents and indexes |
| `src/validation` | Validate and normalize request input with Zod |
| `src/middleware` | Authenticate sessions and handle 404/error responses |
| `src/config` | Validate environment, connect MongoDB, and configure Pino |
| `test` | Exercise APIs with Mocha, Chai, Supertest, and mongodb-memory-server |

JWTs are verified and stored in an HTTP-only cookie. Notes ownership is always derived from the authenticated session, rich-text HTML is sanitized before storage, and logs redact credentials and request bodies.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run test:coverage
npm run build
npm audit --omit=dev
```

See the [root README](../README.md) for environment variables, endpoints, local setup, and the final SonarQube workflow.
