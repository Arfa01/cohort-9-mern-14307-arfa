# 10Pearls Shine Notes App

A full-stack MERN notes application built for the 10Pearls Shine Cohort 9 assignment. Users can register, sign in, and manage private rich-text notes through a responsive React interface.

## Features

- Registration, login, session restoration, and logout
- Protected routes and owner-scoped Notes APIs
- Create, read, update, and delete notes
- Tiptap rich-text editing with headings, emphasis, lists, quotes, and code
- Responsive authentication, dashboard, note-card, and editor layouts
- Loading, empty, retry, not-found, validation, saving, and deletion states
- Pino request, activity, and exception logging with request IDs and redaction
- Structured validation and global exception handling
- Mocha/Chai backend tests and Jest/Testing Library frontend tests
- LCOV coverage reports and SonarQube analysis configuration

Search/filter, real-time updates, import/export, a separate profile screen, and autosave are optional extensions and are not part of the required implementation.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS, Tiptap, React Hook Form, Zod |
| Backend | Node.js, Express 5, TypeScript, MongoDB, Mongoose, Zod, Pino |
| Authentication | bcryptjs, JWT in an HTTP-only cookie |
| Testing | Mocha, Chai, Supertest, mongodb-memory-server, Jest, Testing Library |
| Quality | ESLint, Oxlint, CodeRabbit, c8, LCOV, SonarQube |

## Repository structure

```text
.
├── backend/                  # Express API, MongoDB models, and backend tests
├── frontend/                 # React application and frontend tests
├── sonar-project.properties # SonarQube project and LCOV paths
└── README.md
```

## Prerequisites

- Node.js 22.12 or newer
- npm
- A MongoDB connection string, such as a MongoDB Atlas database

SonarQube is only needed for the final quality scan. The pinned official NPM scanner can be downloaded when that scan is run.

## Local setup

Clone the repository, then install each application's locked dependencies:

```bash
cd backend
cp .env.example .env
npm ci

cd ../frontend
npm ci
```

Update `backend/.env` with your own values. Never commit this file.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production` |
| `PORT` | Express port; the example uses `5000` |
| `MONGODB_URI` | MongoDB connection string |
| `LOG_LEVEL` | Pino level, such as `debug` or `info` |
| `CLIENT_ORIGIN` | Exact browser origin allowed by CORS |
| `JWT_SECRET` | Private secret containing at least 32 characters |
| `JWT_TTL_SECONDS` | Session lifetime from 1 to 31,536,000 seconds |

Run the backend and frontend in separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to `http://localhost:5000` during development.

For production, serve the built frontend and forward same-origin `/api` requests to Express. Set `CLIENT_ORIGIN` to the exact public frontend origin.

## API overview

All endpoints are prefixed with `/api`.

| Method | Endpoint | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | No | Service liveness |
| `GET` | `/health/live` | No | Liveness probe |
| `GET` | `/health/ready` | No | MongoDB readiness probe |
| `POST` | `/auth/register` | No | Register and start a session |
| `POST` | `/auth/login` | No | Authenticate and start a session |
| `GET` | `/auth/me` | Yes | Restore the current user |
| `POST` | `/auth/logout` | No | Idempotently clear the session |
| `GET` | `/notes` | Yes | List the signed-in user's notes |
| `POST` | `/notes` | Yes | Create a note |
| `GET` | `/notes/:noteId` | Yes | Read an owned note |
| `PATCH` | `/notes/:noteId` | Yes | Update an owned note |
| `DELETE` | `/notes/:noteId` | Yes | Delete an owned note |

Notes routes derive ownership from the authenticated session. A client cannot select or override `ownerId`.

Successful responses use `{ "success": true, "data": { ... } }`. Errors use `{ "success": false, "error": { "code": "...", "message": "..." } }`, with field details only when validation requires them.

## Validation and quality checks

Run the complete checks in both applications before pushing a branch:

```bash
cd backend
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev

cd ../frontend
npm run typecheck
npm run lint
npm test
npm run build
npm audit --omit=dev
```

Before final submission, also smoke-test the authentication, dashboard, and editor flows at 320 px, 375 px, and 768 px viewport widths.

Generate the two LCOV reports before a SonarQube scan:

```bash
cd backend
npm run test:coverage

cd ../frontend
npm run test:coverage
```

The reports are written to `backend/coverage/lcov.info` and `frontend/coverage/lcov.info`. Coverage output and SonarScanner working files are ignored by Git.

## Final SonarQube scan

The project is configured now, but the internship requires one final report rather than a scan on every pull request. Run the scan from the final, integrated branch after its dependencies are installed and both coverage reports have been generated.

For a temporary local SonarQube Community Build instance:

```bash
docker run -d \
  --name shine-sonarqube \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -p 9000:9000 \
  sonarqube:community
```

Open `http://localhost:9000`, create a local project using the key `cohort-9-mern-14307-arfa`, and generate an analysis token. Keep the token outside the repository. Run the pinned official NPM scanner from the repository root:

```bash
export SONAR_HOST_URL=http://localhost:9000
export SONAR_TOKEN='your-local-analysis-token'
npx --yes @sonar/scan@5.0.0
```

Use the built-in **Sonar way** JavaScript/TypeScript quality profile unless the mentor requests a custom profile. For the final report, retain the successful scanner output and the SonarQube Quality Gate, Overview, Issues, Security Hotspots, and Measures/Coverage pages. Do not commit the token, coverage folders, or `.scannerwork`.

See the official [SonarQube Community Build quick start](https://docs.sonarsource.com/sonarqube-community-build/try-out-sonarqube) and [SonarScanner for NPM documentation](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/scanners/npm/using) for current details.

## Branching strategy

- `main` contains production-ready code.
- `develop` is the integration branch.
- New work uses `feature/frontend/<feature-name>` or `feature/backend/<feature-name>`.
- Bug fixes use `bugfix/frontend/<bug-description>` or `bugfix/backend/<bug-description>`.
- Every feature or bug-fix branch is reviewed through a pull request into `develop`.
