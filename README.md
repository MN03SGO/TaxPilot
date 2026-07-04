# TaxPilot — DTE Audit Dashboard

Base architecture for auditing Electronic Tax Documents (DTE) built with React 19, Vite, TypeScript, and Tailwind CSS.

## Stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** — minimalist, high-contrast design
- **React Router DOM v7** — client-side routing
- **TanStack Query** + **Axios** — data fetching & caching
- **Recharts** — processing volume chart
- **Lucide React** — icons

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Mock data is enabled by default (`VITE_USE_MOCK=true`).

## Folder Structure

```
src/
├── components/
│   ├── dashboard/     # SummaryCard, AuditTable, charts
│   └── layout/        # Sidebar, Topbar, AppLayout
├── data/              # Mock DTE seed data (dev only)
├── hooks/             # useDteDocuments, useDashboardStats, etc.
├── lib/               # queryClient, formatters, query keys
├── pages/             # Dashboard, Audit, Reports, Settings
├── providers/         # QueryProvider (React Query)
├── services/          # Axios instance + dteService
└── types/             # DteDocument interface & related types
```

## DTE Type

The `DteDocument` interface in `src/types/dte.ts` maps to the `dte_documents` Supabase table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Document identifier |
| `es_valido` | `boolean` | Validation result |
| `observaciones` | `string \| null` | Error notes when invalid |
| `monto_total` | `number` | Audited amount |
| `emisor_nombre` | `string` | Issuer name |

## Connecting Supabase

1. Set `VITE_API_BASE_URL` to your API/Edge Function URL.
2. Set `VITE_USE_MOCK=false`.
3. Implement endpoints: `GET /dte-documents`, `GET /dte-documents/stats`, `GET /dte-documents/processing-volume`.

## Next Steps

Ask Cursor: *"Based on this design, add skeleton loaders to the table and cards to ensure a polished UI while data is being fetched from Supabase."*
