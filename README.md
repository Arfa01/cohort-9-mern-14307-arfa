# cohort-9-mern-14307-arfa
Cohort 9 — MERN (NodeJS+ReactJS) assignment for Arfa Riaz

Notes Web app

Plan for Frontend:
- React
- TypeScript
- Vite
- React Router
- Axios
- React Hook Form
- Zod
- TipTap
- Tailwind CSS
- Lucide React
- Jest
- React Testing Library

Plan for Backend:
- Node.js
- TypeScript
- Express
- MongoDB Atlas
- Mongoose
- Zod
- bcrypt
- JSON Web Tokens
- Pino
- pino-http
- Mocha
- Supertest
- mongodb-memory-server

Quality test tools extentions being used:
- CodeRabbit
- ESLint
- Prettier
- SonarQube

Current planned features:

- User registration
- Secure login and logout
- Protected API routes
- User-specific notes
- Rich-text note creation
- Note editing
- Confirmed note deletion
- Note search
- Validation and meaningful error messages
- Responsive desktop and mobile interface
- Application logging
- Backend and frontend tests
- SonarQube code-quality analysis

## Repository Structure

```text
.
├── backend/       # Planned Express and MongoDB API
├── frontend/      # Planned React application
├── .gitignore
└── README.md
```

## Branching Strategy

- `main` contains production-ready releases only.
- `develop` is the integration branch.
- Feature and bug-fix branches are created from `develop`.
- Feature branches are merged into `develop` through reviewed pull requests.

Example branch names:

```text
feature/project-foundation
feature/backend/authentication
feature/backend/notes-crud
feature/frontend/authentication
feature/frontend/notes-dashboard
bugfix/frontend/editor-overflow
```

## Current Status
- Repository and branch structure established
- Product scope being documented
- Architecture being planned
- Design system being defined
