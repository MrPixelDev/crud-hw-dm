# CRUD HW Backend

NestJS backend with TypeORM, PostgreSQL, JWT access/refresh auth, Russian
Swagger documentation, and committed unit plus Fastify-aware e2e coverage.

## Local setup

```bash
npm install
docker compose up -d
```

Environment defaults are documented in `.env.example`.

## Run locally

```bash
npm run start:dev
```

Local API documentation is available at:

- `http://localhost:3000/docs`
- `http://localhost:3000/docs-json`

Swagger human-facing text is maintained in Russian.

## Validation commands

```bash
npm run build
npm run test -- --runInBand
npm run test:e2e -- --runInBand
docker compose ps
```

## Workflow notes

- Work stays on the current branch for this repository.
- Spec Kit feature resolution uses `.specify/feature.json` when branch-name
  validation does not match the project policy.
- Review the Swagger output after changing DTOs, controllers, auth metadata, or
  response shapes.
