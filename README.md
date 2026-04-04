<div align="center">

<img src="https://s.krea.ai/icons/NodeEditor.png" width="64" height="64" alt="NextFlow" />

# NextFlow

**Visual LLM workflow builder — connect models, media, and prompts into automated pipelines.**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![React Flow](https://img.shields.io/badge/React%20Flow-12.10-FF0072?style=flat-square)](https://reactflow.dev)
[![Trigger.dev](https://img.shields.io/badge/Trigger.dev-v4-6366F1?style=flat-square)](https://trigger.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

</div>

---

## System Architecture

```mermaid
graph TB
    subgraph BROWSER["🌐 Browser — Client Layer"]
        direction TB
        UI["React Flow Canvas\n@xyflow/react 12"]
        STORE["Zustand Store\n+ Zundo Temporal"]
        ENG["Execution Engine\nTopological BFS"]
        EDGE["KreaEdge Renderer\nBezier + Glow + Dot"]
        CTX["Canvas Context Menu\nRight-click Node Picker"]

        UI <-->|"onNodesChange / onConnect"| STORE
        UI --> EDGE
        UI --> CTX
        STORE -->|"nodes, edges, executionStatus"| ENG
        ENG -->|"setNodeExecutionStatus / updateNodeData"| STORE
    end

    subgraph NEXTJS["⚙️ Next.js Server — App Router"]
        direction TB
        SA["Server Action\nexecuteNode()"]
        WF_API["Route: /api/workflows\nGET · POST · PUT · DELETE"]
        RUN_API["Route: /api/workflows/:id/runs\nGET · POST"]
        TL_API["Route: /api/transloadit/signature\nHMAC SHA-384"]
        AUTH["Clerk Middleware\nauth.protect()"]

        AUTH --> WF_API
        AUTH --> RUN_API
        AUTH --> TL_API
        AUTH --> SA
    end

    subgraph DB["🗄️ Neon Postgres — Persistence"]
        direction LR
        WF_TABLE["Workflow\nid · userId · name\nnodes JSON · edges JSON"]
        RUN_TABLE["WorkflowRun\nid · runNumber · scope\nstatus · durationMs"]
        NODE_TABLE["NodeRun\nnodeId · nodeType\nstatus · inputs · outputs · error"]

        WF_TABLE -->|"has many CASCADE"| RUN_TABLE
        RUN_TABLE -->|"has many CASCADE"| NODE_TABLE
    end

    subgraph TRIGGER["🔧 Trigger.dev Workers — Async Tasks"]
        direction TB
        LLM_T["llm-task\nGemini multimodal\nmax 120s · 3 retries"]
        CROP_T["crop-image-task\nSharp extract\nmax 180s · 3 retries"]
        FRAME_T["extract-frame-task\nFFmpeg frames:v 1\nmax 180s · 3 retries"]
    end

    subgraph EXTERNAL["☁️ External Services"]
        GEMINI["Google Gemini API\ngemini-2.5-flash\ngemini-2.0-flash\ngemini-1.5-pro"]
        TL["Transloadit CDN\nAssembly polling\nDurable SSL URLs"]
        CLERK["Clerk Auth\nJWT · Session · Routes"]
        FFMPEG_EXT["FFmpeg 7\n@trigger.dev/build\nWorker extension"]
    end

    ENG -->|"Server Action call\nnodeType dispatch"| SA
    SA -->|"tasks.trigger\nwaitForRun poll 2s x120"| LLM_T
    SA -->|"tasks.trigger\nwaitForRun poll 2s x120"| CROP_T
    SA -->|"tasks.trigger\nwaitForRun poll 2s x120"| FRAME_T

    WF_API -->|"prisma.workflow.*\nscoped to userId"| WF_TABLE
    RUN_API -->|"prisma.workflowRun.*\nprisma.nodeRun.*"| RUN_TABLE

    LLM_T -->|"generateContent\ninlineData base64"| GEMINI
    CROP_T -->|"uploadToTransloadit\nassembly poll"| TL
    FRAME_T -->|"uploadToTransloadit\nassembly poll"| TL
    FRAME_T -->|"execFile ffmpeg\nexecFile ffprobe"| FFMPEG_EXT

    UI -->|"XHR multipart\nSHA-384 signed params"| TL
    BROWSER -->|"Clerk SDK\nsession JWT"| CLERK

    classDef browser fill:#1a1a2e,stroke:#4d9de0,color:#e0e0e0
    classDef server fill:#1a2e1a,stroke:#29D246,color:#e0e0e0
    classDef db fill:#2e1a1a,stroke:#FCC800,color:#e0e0e0
    classDef worker fill:#1a1a2e,stroke:#9B6FFF,color:#e0e0e0
    classDef external fill:#2e2e2e,stroke:#888,color:#ccc

    class UI,STORE,ENG,EDGE,CTX browser
    class SA,WF_API,RUN_API,TL_API,AUTH server
    class WF_TABLE,RUN_TABLE,NODE_TABLE db
    class LLM_T,CROP_T,FRAME_T worker
    class GEMINI,TL,CLERK,FFMPEG_EXT external
```

---

## Execution Data Flow

```mermaid
sequenceDiagram
    actor User
    participant Store as Zustand Store
    participant Engine as Execution Engine
    participant SA as Server Action
    participant TD as Trigger.dev
    participant Worker as Task Worker
    participant Ext as External Service

    User->>Store: Click Run → resetExecutionStatus()
    Store->>Engine: executeWorkflow(nodes, edges, "FULL")

    Note over Engine: buildAdjacency()<br/>BFS topological sort → levels[][]

    loop For each level in parallel via Promise.all
        Engine->>Store: setNodeExecutionStatus(nodeId, "running")
        Engine->>Engine: resolve inputs from upstream nodeOutputs[]

        Engine->>SA: executeNode({ nodeId, nodeType, nodeData, inputs })

        alt textNode / uploadImageNode / uploadVideoNode
            SA-->>Engine: output = rawValue (no task)

        else llmNode
            SA->>TD: tasks.trigger("llm-task", payload)
            TD->>Worker: spawn llm-task
            Worker->>Ext: Gemini generateContent() with base64 images
            Ext-->>Worker: text response
            Worker-->>TD: output string
            loop poll every 2s max 120x
                SA->>TD: runs.retrieve(runId)
            end
            SA-->>Engine: output string

        else cropImageNode
            SA->>TD: tasks.trigger("crop-image-task", payload)
            TD->>Worker: spawn crop-image-task
            Worker->>Worker: fetch URL → Sharp.extract() → JPEG
            Worker->>Ext: uploadToTransloadit()
            Ext-->>Worker: ssl_url
            SA-->>Engine: output CDN URL

        else extractFrameNode
            SA->>TD: tasks.trigger("extract-frame-task", payload)
            TD->>Worker: spawn extract-frame-task
            Worker->>Worker: ffprobe duration if pct timestamp
            Worker->>Worker: ffmpeg -ss seek -frames:v 1
            Worker->>Ext: uploadToTransloadit()
            Ext-->>Worker: ssl_url
            SA-->>Engine: output CDN URL
        end

        Engine->>Store: nodeOutputs[nodeId] = output
        Engine->>Store: setNodeExecutionStatus(nodeId, "success")
        Engine->>Store: updateNodeData(nodeId, result)
    end

    Engine->>Store: addRun({ nodeRuns, durationMs, status })
```

---

## Edge Color System

```mermaid
flowchart LR
    subgraph Handles["Source Handles"]
        TN["textNode :outputText"]
        LO["llmNode :output"]
        IN["uploadImageNode :outputImage"]
        CN["cropImageNode :output"]
        FN["extractFrameNode :output"]
        VN["uploadVideoNode :outputVideo"]
    end

    subgraph Types["Data Type"]
        TEXT["text"]
        IMAGE["image"]
        VIDEO["video"]
    end

    subgraph Colors["Edge Color"]
        Y["#FCC800 Yellow"]
        B["#0080FF Blue"]
        G["#29D246 Green"]
    end

    subgraph Layers["KreaEdge Render Layers"]
        L1["Glow halo — blurred wide stroke"]
        L2["Core stroke — solid bezier no dash"]
        L3["Inner highlight — tubular depth"]
        L4["animateMotion dot — only when running"]
        L5["Transparent 24px hit area"]
    end

    TN & LO --> TEXT --> Y --> Layers
    IN & CN & FN --> IMAGE --> B --> Layers
    VN --> VIDEO --> G --> Layers
```

---

## Autosave State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle : workflow loaded from DB

    Idle --> Debouncing : nodes / edges / name changed
    Debouncing --> Debouncing : another change within 800ms
    Debouncing --> SnapshotCheck : 800ms elapsed

    SnapshotCheck --> Idle : snapshot equals lastSaved
    SnapshotCheck --> Skip : id is sample
    SnapshotCheck --> NoContent : id is new, nothing meaningful
    SnapshotCheck --> CreateNew : id is new, has content
    SnapshotCheck --> UpdateExisting : id is real cuid

    Skip --> Idle
    NoContent --> Idle

    CreateNew --> POST : POST /api/workflows
    POST --> Redirect : router.replace /workflow/:newId
    Redirect --> Idle : workflowId updated in store

    UpdateExisting --> PUT : PUT /api/workflows/:id
    PUT --> Idle : lastSavedSnapshot updated
```

---

## Database Schema

```mermaid
erDiagram
    Workflow {
        string id PK "cuid()"
        string userId "Clerk user ID"
        string name
        json nodes "WorkflowNode[]"
        json edges "Edge[]"
        datetime createdAt
        datetime updatedAt
    }

    WorkflowRun {
        string id PK "cuid()"
        string workflowId FK
        string userId
        int runNumber "monotonic per workflow"
        enum scope "FULL | PARTIAL | SINGLE"
        enum status "RUNNING | SUCCESS | FAILED | PARTIAL"
        int durationMs
        datetime createdAt
    }

    NodeRun {
        string id PK "cuid()"
        string workflowRunId FK
        string nodeId
        string nodeType
        string nodeLabel
        enum status "RUNNING | SUCCESS | FAILED | SKIPPED"
        json inputs
        json outputs
        string error "nullable"
        int durationMs
    }

    Workflow ||--o{ WorkflowRun : "CASCADE"
    WorkflowRun ||--o{ NodeRun : "CASCADE"
```

---

## Quick Start

```bash
git clone https://github.com/your-username/nextflow.git
cd nextflow && npm install

cp .env.example .env.local   # fill in all variables

npx prisma generate
npx prisma migrate deploy

# Terminal 1 — Trigger.dev worker
npx trigger.dev@latest dev

# Terminal 2 — Next.js
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in → `/nodes` gallery.

---

## Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/nodes
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/nodes

# Neon Postgres
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Google Gemini
GOOGLE_AI_API_KEY=AIza...

# Trigger.dev  (use tr_prod_... in production)
TRIGGER_SECRET_KEY=tr_dev_...

# Transloadit
NEXT_PUBLIC_TRANSLOADIT_KEY=...
TRANSLOADIT_SECRET=...
NEXT_PUBLIC_TRANSLOADIT_IMAGE_TEMPLATE_ID=...
NEXT_PUBLIC_TRANSLOADIT_VIDEO_TEMPLATE_ID=...
```

---

## Deployment

**Web (Vercel):** `vercel --prod` — add env vars in the dashboard, use `pgbouncer=true&connection_limit=1` on `DATABASE_URL`.

**Tasks (Trigger.dev):** `npx trigger.dev@latest deploy` — must be deployed separately from the web app. FFmpeg 7 is provisioned automatically via the `@trigger.dev/build` extension.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                  # Clerk sign-in / sign-up
│   ├── (dashboard)/
│   │   ├── nodes/               # Workflow gallery
│   │   └── workflow/[id]/       # Canvas editor + autosave
│   ├── actions/executeWorkflow  # Server Action: node dispatch + Trigger poll
│   └── api/
│       ├── workflows/[id]/runs  # Run history CRUD
│       ├── workflows/           # Workflow CRUD
│       └── transloadit/         # HMAC signature
├── components/
│   ├── canvas/                  # WorkflowCanvas, KreaEdge, TopBar, Toolbar, ContextMenu
│   ├── nodes/                   # NodeWrapper + 6 node types
│   └── sidebar/                 # Left nav + Right panel (history / assets)
├── lib/                         # executionEngine, runWorkflowMode, sampleWorkflow, schemas
├── store/workflowStore          # Zustand + Zundo temporal (50 step undo)
├── trigger/                     # llmTask, cropImageTask, extractFrameTask
└── types/                       # NodeType, *NodeData, WorkflowRunRecord
```

---

## Sample Workflow

**Product Marketing Kit Generator** — at `/workflow/sample`, uses all six node types.

```
Upload Image ──► Crop (80%×80%) ──────────────────► LLM: Product Description ──┐
                                                                                  ▼
Upload Video ──► Extract Frame (50%) ────────────────────────────────────► LLM: Marketing Tweet
                                                                                  ▲
Prompt Nodes ─────────────────────────────────────────────────────────────────────┘
```

---

## License

MIT © 2026 Mohammed Talha Ansari
