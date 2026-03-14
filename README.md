# Arcs and Spaces Interiors Back Office

A web-based back-office management application for **Arcs and Spaces Interiors** built with **Angular 21** and a lightweight **Node.js + Express** API.

## What it includes

- Dashboard with project, worker, and asset statistics
- Project / site management with client details, status, timeline, materials, budget, and notes
- Worker management with roles, project assignment, contact details, and work logs
- Design asset management with project-based upload and storage
- Local JSON-backed API with image/document upload support

## Stack

- Frontend: Angular standalone components, routing, reactive forms, HttpClient
- Backend: Node.js, Express, Multer
- Storage: Local JSON datastore in `data/db.json` and uploaded files in `uploads/`
- Deployment: Render using `render.yaml`

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

## Production build

```bash
npm run build
npm run serve:prod
```

This serves the built Angular app and the API from the same Express server.

## Publish on Render

This repo now includes [render.yaml](./render.yaml), so you can deploy it as a Render Web Service.

### First publish

1. Push the repo to GitHub
2. In Render, choose **New +** -> **Blueprint**
3. Connect your GitHub account and select this repository
4. Render will detect `render.yaml`
5. Deploy the service

Render will use:

```bash
npm install && npm run build
```

for build, and:

```bash
npm run serve:prod
```

for start.

## Future update commands

After making new changes, use:

```bash
git add .
git commit -m "your update message"
git push origin main
```

You can also use the package script for the push step:

```bash
npm run push:main
```

or:

```bash
npm run publish:render
```

If Render auto-deploy is enabled, every push to `main` will automatically publish the new version.

## Project structure

- `src/app/features/` contains the dashboard, projects, workers, and assets screens
- `src/app/core/` contains shared models and API services
- `server/server.js` contains the Express backend and production static serving
- `data/db.json` contains the seeded application data
- `uploads/` stores uploaded project files
- `render.yaml` contains the deployment configuration

## Important note about storage

This app currently stores data and uploaded files on the local filesystem. That is fine for local use and demo publishing, but on many free hosts those files are **not permanently persistent** after restarts or redeploys.

For fully reliable cloud persistence later, the next upgrade should be moving `data/` and `uploads/` to a managed service such as Supabase Storage / Postgres or Firebase.

## Notes

- A small postinstall patch is included to avoid a Windows Angular CLI `npm` shim issue in this environment.
- The project already includes helper scripts for build, local API, production serving, and future push/publish flows.
