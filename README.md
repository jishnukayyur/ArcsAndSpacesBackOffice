# Arcs and Spaces Interiors Back Office

A web-based back-office management application for **Arcs and Spaces Interiors** built with **Angular 21** and a lightweight **Node.js + Express** API.

## What it includes

- Dashboard with project, worker, and asset statistics
- Project / site management with client details, status, timeline, materials, budget, and notes
- Worker management with roles, project assignment, contact details, and work logs
- Design asset management with project-based upload and storage
- Local JSON-backed API with image/document upload support for a simple free-to-maintain backend setup

## Stack

- Frontend: Angular standalone components, routing, reactive forms, HttpClient
- Backend: Node.js, Express, Multer
- Storage: Local JSON datastore in `data/db.json` and uploaded files in `uploads/`

## Run locally

Install dependencies:

```bash
npm install
```

Start the Angular app and API together:

```bash
npm run dev
```

The frontend runs on `http://localhost:4200` and the API runs on `http://localhost:3000`.

If you want to run them separately:

```bash
npm run start
npm run api
```

## Build

```bash
npm run build
```

The production bundle is generated in `dist/arcs-and-spaces-backoffice`.

## Project structure

- `src/app/features/` contains the dashboard, projects, workers, and assets screens
- `src/app/core/` contains shared models and API services
- `server/server.js` contains the Express backend
- `data/db.json` contains the seeded application data
- `uploads/` stores uploaded project files

## Notes

- A small postinstall patch is included to avoid a Windows Angular CLI `npm` shim issue in this environment.
- This setup is intentionally lightweight so it is easy to extend later with authentication, a hosted database, or a managed backend such as Firebase or Supabase.
"# ArcsAndSpacesBackOffice" 
