# NextFlow

NextFlow is a Krea.ai-inspired workflow builder for multimodal LLM pipelines. It combines a React Flow canvas, authenticated workflow persistence, Trigger.dev task execution, Gemini integration, and media processing into a single end-to-end system.

The project focuses on:
- a compact Krea-style node editor UX
- type-safe workflow construction and execution
- authenticated user-scoped workflows and run history
- server-side task execution for LLM, image, and video operations

## Features

- `Clerk` authentication with protected workflow routes
- `React Flow` canvas with minimap, zoom, pan, selection, and animated typed edges
- six workflow node types:
  - `Text`
  - `Upload Image`
  - `Upload Video`
  - `Run Any LLM`
  - `Crop Image`
  - `Extract Frame`
- inline node results for LLM, crop, and extract-frame outputs
- full workflow runs, single-node runs, and selected-node runs
- persisted workflow history with node-level execution records
- autosaved workflow graph state:
  - node positions
  - edges
  - node configuration
  - workflow name
- JSON export/import
- built-in sample workflow: `Product Marketing Kit Generator`

## Tech Stack

- `Next.js 16` with App Router
- `TypeScript`
- `Tailwind CSS`
- `React Flow` (`@xyflow/react`)
- `Zustand` + `zundo` for editor state and undo/redo
- `Clerk` for authentication
- `Prisma` for ORM
- `Neon Postgres` for workflow and run persistence
- `Trigger.dev` for all executable node tasks
- `Google Gemini` via `@google/generative-ai`
- `Transloadit` for file uploads and durable media outputs
- `FFmpeg` inside Trigger workers for frame extraction
- `Sharp` for server-side image cropping

## Architecture

### Frontend

The editor is built around `React Flow` and a centralized Zustand store. The store manages:
- nodes
- edges
- selection state
- execution state
- workflow metadata
- local run state

Canvas interactions such as drag, connect, delete, cut, selection, and undo/redo are handled in the client. Workflow graph changes are autosaved through the workflow API.

### Backend

The backend is composed of:
- `Next.js route handlers` for workflow CRUD and execution APIs
- `Prisma` models for workflows and workflow run history
- `Clerk` route protection and user scoping
- `Trigger.dev` tasks for:
  - Gemini execution
  - image crop execution
  - video frame extraction

### Persistence

Workflow definitions are stored in `Neon Postgres` with:
- `name`
- `description`
- `nodes`
- `edges`

Run history is also stored in Postgres and includes:
- run scope (`FULL`, `PARTIAL`, `SINGLE`)
- run status
- duration
- node-level outputs and errors

## Node Types

### 1. Text Node

- freeform textarea input
- output handle for text data

### 2. Upload Image Node

- uploads image assets via Transloadit
- supports preview rendering
- outputs durable image URL

### 3. Upload Video Node

- uploads video assets via Transloadit
- supports inline video preview
- outputs durable video URL

### 4. Run Any LLM Node

- Gemini model selector
- accepts:
  - `system_prompt`
  - `prompt`
  - `images`
- executes via Trigger.dev
- renders response inline on the node

### 5. Crop Image Node

- accepts source image URL
- configurable crop percentages
- crops server-side with `sharp`
- uploads result to Transloadit

### 6. Extract Frame Node

- accepts video URL
- supports timestamp in seconds or percentage form like `50%`
- runs FFmpeg inside Trigger worker
- uploads extracted frame to Transloadit

## Sample Workflow

The built-in sample workflow is `Product Marketing Kit Generator`.

It demonstrates:
- all six node types
- media upload and transformation
- multimodal LLM prompting
- branching execution
- convergence into a final LLM result

The workflow is available at:

```txt
/workflow/sample
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your own credentials.

Required variables:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/workflow/new
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/workflow/new

# Neon Postgres
DATABASE_URL=

# Google Gemini
GOOGLE_AI_API_KEY=

# Trigger.dev
TRIGGER_SECRET_KEY=

# Transloadit
NEXT_PUBLIC_TRANSLOADIT_KEY=
TRANSLOADIT_SECRET=
NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID=
NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID=
```

Notes:
- production should use a production `TRIGGER_SECRET_KEY`, not a `tr_dev_...` key
- `FFMPEG_PATH` and `FFPROBE_PATH` are not required in production when Trigger’s FFmpeg build extension is used

## Local Development

Install dependencies:

```bash
npm install
```

Run the Trigger.dev worker in one terminal:

```bash
npx trigger.dev@latest dev
```

Run the Next.js app in another:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Database Setup

Generate Prisma client:

```bash
npx prisma generate
```

Run migrations:

```bash
npx prisma migrate deploy
```

For local schema changes:

```bash
npx prisma migrate dev
```

## Production Deployment

### 1. Deploy the web app

Deploy to Vercel:

```bash
vercel --prod
```

### 2. Deploy Trigger tasks

Trigger tasks must be deployed separately:

```bash
npx trigger.dev@latest deploy
```

This project uses Trigger.dev for all executable node types, so deploying only the web app is not sufficient.

## Build

Run a production build:

```bash
npm run build
```

If you hit font fetch issues locally, that is typically an environment/network issue around `next/font` and not a workflow-specific application error.

## Workflow Persistence

Workflows are autosaved from the editor. The following state persists across reloads:
- nodes
- edges
- positions
- workflow name
- node parameter values

New untitled workflows are automatically promoted into a real persisted workflow record on first meaningful edit.

## Run History

The right sidebar displays persisted run history with:
- status
- duration
- scope
- timestamp
- node-level results and errors

Supported run scopes:
- full workflow
- selected nodes
- single node

## Export / Import

Workflows can be exported and imported as JSON from the bottom toolbar.

The JSON payload contains:
- `nodes`
- `edges`

## Project Structure

```txt
src/
  app/
    api/
    (auth)/
    (dashboard)/
  components/
    canvas/
    nodes/
    sidebar/
  hooks/
  lib/
  store/
  trigger/

prisma/
  schema.prisma
```

## Notes for Reviewers

This repository is designed to demonstrate:
- product-quality frontend implementation
- typed graph-based interaction design
- authenticated persistence
- server-side task orchestration
- media + LLM pipeline execution

For the clearest product walkthrough, use the built-in sample workflow or create the `Product Marketing Kit Generator` workflow manually during the demo.
