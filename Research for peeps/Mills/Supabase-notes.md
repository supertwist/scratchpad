## Supabase in a nutshell  

**Supabase** is an open‑source “backend‑as‑a‑service” (BaaS) platform that gives you everything you need to build a modern web or mobile application—**database, authentication, real‑time subscriptions, storage, and server‑less functions**—with a single, developer‑friendly API.  
Think of it as the **open‑source alternative to Firebase**, but built on top of **PostgreSQL**, the most popular relational database in the world.

| What Supabase provides | Firebase equivalent | How it works under the hood |
|------------------------|---------------------|-----------------------------|
| **Database**           | Firestore / Realtime DB | PostgreSQL (fully managed) |
| **Auto‑generated REST/GraphQL API** | Cloud Firestore REST API | PostgREST (REST) + Hasura‑style GraphQL (optional) |
| **Auth**               | Firebase Auth       | GoTrue (JWT + OAuth) |
| **Realtime**           | Firestore Realtime listeners | Elixir‑based Realtime server that watches Postgres WAL |
| **File storage**       | Firebase Storage   | S3‑compatible object storage |
| **Edge/Serverless functions** | Cloud Functions | Supabase Edge Functions (Deno) |
| **Dashboard & CLI**    | Firebase Console   | Supabase Studio + supabase‑cli |

---

## Core Architecture (what runs behind the scenes)

```
+---------------------------+        +---------------------+
| Supabase Studio (Web UI)  | <--->  |  Postgres Database  |
+---------------------------+        +---------------------+
          ^   ^                            ^   ^
          |   |                            |   |
          |   |    +-----------------+     |   |
          |   +----|   PostgREST     |-----+   |
          |        +-----------------+         |
          |                                      |
          |   +-----------------+      +-----------------+
          +---|   Realtime (Elixir) |  |   GoTrue (Auth) |
          |   +-----------------+      +-----------------+
          |                                      |
          |   +-----------------+      +-----------------+
          +---|  Storage (S3)   |      | Edge Functions  |
              +-----------------+      +-----------------+
```

* **PostgreSQL** – the single source of truth. All data lives here.  
* **PostgREST** – automatically exposes a **RESTful** endpoint (`/rest/v1`) for every table, view, or stored procedure.  
* **Realtime** – listens to PostgreSQL’s write‑ahead log (WAL) and pushes changes over **WebSocket** (`/realtime/v1`).  
* **GoTrue** – handles sign‑up, sign‑in, password‑reset, magic‑link, and third‑party OAuth (Google, GitHub, etc.) and issues **JWTs** that are understood by Postgres Row‑Level Security (RLS).  
* **Storage** – an S3‑compatible bucket service for files, images, videos, etc.  
* **Edge Functions** – tiny serverless Deno scripts that run at the edge (global CDN) and can be called via HTTP or from your client.  

All these pieces are either **self‑hostable** (via Docker compose, Kubernetes, or Vercel) or available as a **managed cloud service** (supabase.com). The managed service gives you a hosted PostgreSQL instance, automatic backups, and a free tier that’s generous enough for prototypes.

---

## Key Features (why you might pick Supabase)

| Feature | What it means for you |
|---------|-----------------------|
| **SQL‑first** | You write plain PostgreSQL – all the power of relational queries, joins, transactions, stored procedures, and extensions (PostGIS, pgvector, etc.). |
| **Row‑Level Security (RLS)** | Secure your data at the DB level; policies are written in SQL and enforced for every request, even from the client. |
| **Instant API** | No need to write a separate backend: every table, view, and function is instantly reachable via REST (or GraphQL via the optional plugin). |
| **Realtime** | Subscribing to a table (or a query) gives you push updates over WebSocket, perfect for chat, dashboards, collaborative editing. |
| **Auth with JWT** | Supports email/password, magic links, OTP, and OAuth providers; the JWT can be used directly in PostgreSQL queries via `auth.uid()`. |
| **File Storage** | Large objects stored in an S3 bucket, with built‑in signed URLs for secure downloads. |
| **Edge Functions** | Deno‑based serverless functions that run at the edge, great for webhooks, image processing, or custom auth flows. |
| **Migrations & CLI** | `supabase db push`, `supabase db diff`, and `supabase migration` let you version‑control schema changes just like any other code repo. |
| **Open‑source** | All core services are on GitHub (PostgREST, GoTrue, Realtime, Storage, etc.). You can self‑host or contribute. |
| **Integrations** | Works nicely with frameworks like Next.js, Nuxt, Remix, Flutter, React Native, SvelteKit, and more via the official `@supabase/supabase-js` (or `supabase-dart`, `supabase-flutter`, `supabase-py`) client libraries. |
| **Analytics & Dashboard** | Supabase Studio gives you tables, logs, auth users, storage files, and function metrics—all in a UI. |

---

## Typical Developer Workflow

1. **Create a project** (via Supabase Studio or `supabase projects create`).  
2. **Define your schema** – write `CREATE TABLE` statements (or use the visual table builder).  
3. **Enable RLS** and write policies (e.g., `policy "users can read own rows"`).  
4. **Add auth** – configure email, OAuth providers, and enable email confirmations.  
5. **Use the generated API** – in your frontend:

   ```ts
   // Using @supabase/supabase-js
   import { createClient } from '@supabase/supabase-js'

   const supabase = createClient(
     'https://xyz-company.supabase.co',
     'public-anon-key'
   );

   // Sign‑up
   const { user, error } = await supabase.auth.signUp({
     email: 'alice@example.com',
     password: 'super‑secret',
   });

   // Insert a row (RLS will enforce that alice can only insert her own profile)
   const { data, error: insertError } = await supabase
     .from('profiles')
     .insert({ id: user?.id, name: 'Alice' });

   // Real‑time subscription
   const subscription = supabase
     .channel('public:messages')
     .on(
       'postgres_changes',
       { event: '*', schema: 'public', table: 'messages' },
       (payload) => {
         console.log('New message:', payload.new);
       }
     )
     .subscribe();
   ```

6. **Add Edge Functions** (e.g., a webhook that sends a Slack notification when a new row is inserted):

   ```ts
   // supabase/functions/notify_slack/index.ts
   import { serve } from 'https://deno.land/x/supabase/functions/mod.ts';

   serve(async (req) => {
     const { event, payload } = await req.json();
     if (event === 'INSERT' && payload.table === 'orders') {
       await fetch(Deno.env.get('SLACK_WEBHOOK')!, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           text: `New order #${payload.record.id} placed by ${payload.record.user_id}`
         })
       });
     }
     return new Response('OK');
   });
   ```

   Deploy with `supabase functions deploy notify_slack`.

7. **Version‑control** the schema and functions with `supabase db push` and `supabase functions sync`.  

8. **Go to production** – upgrade your project plan (or self‑host) and keep the same code; nothing changes in the client.

---

## Supabase vs. Firebase – Quick Comparison

| Area | Supabase (Postgres‑first) | Firebase (NoSQL‑first) |
|------|---------------------------|------------------------|
| **Data model** | Relational, ACID‑compliant, supports joins, transactions, constraints. | Document/collection (NoSQL), eventual consistency in Realtime DB, strong consistency in Firestore. |
| **Query language** | Full SQL + extensions (PostGIS, pgvector, etc.). | Firestore queries (limited) or Realtime Database queries (very shallow). |
| **Realtime** | WAL‑based change streams → WebSocket (any SQL query). | Built‑in listeners on document/collection changes. |
| **Auth** | GoTrue (JWT) + RLS integration. | Firebase Auth (JWT) – separate from database security. |
| **Storage** | S3‑compatible object storage (private/public). | Google Cloud Storage. |
| **Serverless** | Edge Functions (Deno) + PostgreSQL functions (SQL/Rust). | Cloud Functions (Node, Python, Go, etc.) |
| **Pricing (managed)** | Free tier: 500 MB DB, 1 GB storage, 2 M realtime messages; generous paid plans. | Free tier: 1 GB storage, 50 k reads/writes; pricing can become high for heavy usage. |
| **Open source** | Core services are 100 % open source. | Only client SDKs are open; backend is proprietary. |
| **Vendor lock‑in** | Low – you can export your DB, self‑host, or move to any Postgres host. | High – data format and security rules are Firebase‑specific. |
| **Ecosystem** | Growing community, many plugins (PostgREST, GraphQL, pgvector). | Mature, massive docs, many third‑party libs. |

If you **love SQL**, need **complex queries**, or want a **portable backend**, Supabase is a natural fit. If you’re building a simple, document‑centric app and want everything in Google’s ecosystem, Firebase may still be attractive.

---

## When to Choose Supabase

| Use‑case | Why Supabase shines |
|----------|----------------------|
| **SaaS MVPs** | Rapidly spin up a DB + auth + storage with a single CLI command. |
| **Data‑intensive apps** (analytics dashboards, admin panels) | Use SQL for aggregations, joins, window functions. |
| **Real‑time collaboration** (chat, live editing, dashboards) | Realtime subscriptions on any query, no extra server needed. |
| **Geospatial / Vector search** | Leverage PostGIS (`ST_Distance`) or pgvector (`<->`) extensions. |
| **Self‑hosted products** | Deploy the open‑source stack on your own infra (Docker, K8s). |
| **Regulated industries** | Full control over data location, backups, and audit logs. |
| **Learning SQL** | Provides a “Firebase‑like” developer experience while you practice real SQL. |

---

## Getting Started – Step‑by‑Step (Free Tier)

1. **Create an account**: https://supabase.com  
2. **New project** → choose region, name, and password for the database.  
3. **Install the CLI** (optional but recommended):

   ```bash
   npm i -g supabase
   # or with Homebrew:
   brew install supabase/tap/supabase
   ```

4. **Initialize a local project**:

   ```bash
   supabase init
   ```

   This creates a `supabase/` folder with `schema.sql`, `functions/`, and `.env` files.

5. **Define a table** (e.g., `todos`):

   ```sql
   -- supabase/migrations/20240309_create_todos.sql
   create table public.todos (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null,
     title text not null,
     is_complete boolean default false,
     created_at timestamp with time zone default now()
   );

   alter table public.todos enable row level security;
   create policy "users can CRUD their own todos"
     on public.todos
     for all
     using (auth.uid() = user_id);
   ```

   Push it:

   ```bash
   supabase db push
   ```

6. **Add authentication** in the Dashboard → **Authentication → Settings** → enable Email & password, Google, etc.

7. **Write client code** (React example):

   ```tsx
   import { useEffect, useState } from 'react';
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   );

   function App() {
     const [todos, setTodos] = useState<any[]>([]);
     const [session, setSession] = useState<any>(null);

     useEffect(() => {
       supabase.auth.getSession().then(({ data }) => setSession(data.session));

       const {
         data: { subscription },
       } = supabase
         .channel('public:todos')
         .on(
           'postgres_changes',
           { event: '*', schema: 'public', table: 'todos' },
           (payload) => {
             // Re-fetch after any change
             fetchTodos();
           }
         )
         .subscribe();

       return () => {
         supabase.removeChannel(subscription);
       };
     }, []);

     const fetchTodos = async () => {
       const { data, error } = await supabase
         .from('todos')
         .select('*')
         .order('created_at', { ascending: false });
       if (!error) setTodos(data);
     };

     // Render UI, login forms, add todo, toggle complete, etc.
   }
   ```

8. **Deploy** – you can keep using the managed service (no extra steps) or self‑host:

   *Self‑host with Docker Compose (quick local dev):*

   ```yaml
   version: '3.8'
   services:
     db:
       image: supabase/postgres:15
       environment:
         POSTGRES_PASSWORD: yourpassword
         POSTGRES_DB: postgres
       ports: ["5432:5432"]
     rest:
       image: postgrest/postgrest
       depends_on: [db]
       environment:
         PGRST_DB_URI: "postgres://postgres:yourpassword@db:5432/postgres"
         PGRST_DB_ANON_ROLE: "anon"
       ports: ["3000:3000"]
     realtime:
       image: supabase/realtime
       depends_on: [db]
       environment:
         DB_HOST: db
         DB_PORT: 5432
         DB_PASSWORD: yourpassword
       ports: ["4000:4000"]
     auth:
       image: supabase/gotrue
       # ... similar env vars ...
   ```

   Then run `docker compose up -d`.

---

## Pricing (as of early 2026)

| Tier | Monthly price (USD) | Included resources | When to upgrade |
|------|----------------------|--------------------|-----------------|
| **Free** | $0 | 500 MB DB, 1 GB storage, 2 M realtime messages, 500 k Edge Function invocations | Small prototypes, personal projects |
| **Pro** | $25 (per project) | 8 GB DB, 100 GB storage, 50 M realtime messages, 5 M Edge invocations | Growing SaaS, beta launches |
| **Team** | $100 | 50 GB DB, 500 GB storage, 250 M realtime, 25 M Edge | Production SaaS with moderate traffic |
| **Enterprise** | Custom | Unlimited (or negotiated) resources, SLA, dedicated support, VPC, HIPAA compliance | Large‑scale, mission‑critical workloads |

All tiers include **automatic daily backups**, **point‑in‑time recovery**, and **regional replication** (select regions). You can also add **additional add‑ons** such as **custom domain**, **audit logs**, and **priority support**.

*Tip:* Because Supabase runs on PostgreSQL, you can also **export your database** at any time (`pg_dump`) and import it into another cloud provider or self‑hosted instance—no vendor lock‑in.

---

## Community & Ecosystem

* **GitHub (core services)** – https://github.com/supabase  
  * `supabase/postgrest`, `supabase/gotrue`, `supabase/realtime`, `supabase/storage-api`, `supabase/cli`  
* **Discord** – vibrant community with channels for `#help`, `#edge-functions`, `#self-hosting`.  
* **GitHub Discussions & Issues** – great place to ask feature requests or report bugs.  
* **Supabase Docs** – https://supabase.com/docs (comprehensive, with interactive tutorials).  
* **Third‑party integrations** – Hasura GraphQL Engine, Prisma (via Postgres), Netlify/ Vercel deployments, Remix, Next.js, SvelteKit, Flutter, React Native, and even WordPress (via Supabase plugin).  
* **Plugins & Extensions** –  
  * `supabase/pg_graphql` – GraphQL wrapper around Postgres.  
  * `supabase/pgvector` – Vector similarity search (useful for AI/ML).  
  * `supabase/pg_cron` – Scheduled jobs.  
  * `supabase/pg_tap` – Test Anything Protocol for database tests.  

---

## Common Pitfalls & How to Avoid Them

| Pitfall | Explanation | Mitigation |
|---------|-------------|------------|
| **RLS not enabled** | By default tables are open; forgetting to enable RLS can expose all data. | Enable RLS (`ALTER TABLE … ENABLE ROW LEVEL SECURITY`) **as soon as you create a table** and write a policy before any client code runs. |
| **Storing secrets in client code** | The `anon` key is public; using it for privileged operations will fail. | Use **service_role** key **only on the server** (e.g., in Edge Functions or your own backend). |
| **Large file uploads hitting storage quotas** | Supabase storage counts against your plan; unbounded uploads can bust the quota. | Validate file size on the client, use signed URLs, and optionally set bucket policies (`maxSize`). |
| **Realtime over‑subscription** | Subscribing to a very high‑traffic table can overwhelm the client. | Use **filtered subscriptions** (`filter` parameter) or **listen to specific events** (`INSERT` only). |
| **Blocking migrations on production** | Running `supabase db push` can lock tables if you add heavy indexes. | Test migrations on a staging copy, use `CREATE INDEX CONCURRENTLY` when possible, and schedule during low traffic. |
| **Edge Function cold starts** | Deno functions may have a small latency on first request. | Keep functions warm with a periodic “ping” or use a higher tier that offers warm instances. |
| **SQL injection via client** | Supabase client automatically uses parameterized queries, but raw SQL in RPC functions can be risky. | Prefer **prepared statements** (`$1`, `$2`) and never concatenate user input into raw SQL strings. |

---

## Quick “Cheat Sheet” – Supabase Commands

| Command | Purpose |
|--------|---------|
| `supabase start` | Spin up local Docker stack (Postgres, Realtime, GoTrue, Storage, Studio). |
| `supabase db push` | Apply the current `schema.sql` to the remote database (or local). |
| `supabase db dump` | Export the entire database (`pg_dump`). |
| `supabase db diff` | Show diff between local migrations and remote schema. |
| `supabase functions new <name>` | Scaffold a new Edge Function (Deno). |
| `supabase functions deploy <name>` | Deploy the function to the cloud. |
| `supabase functions logs <name> -f` | Tail logs for a function. |
| `supabase secrets set KEY=VALUE` | Store secret environment variables for Edge Functions. |
| `supabase projects list` | List all projects under your account (useful for CI scripts). |
| `supabase logout` | Clear auth token from CLI. |

---

## Example: Building a Tiny “Todo” SaaS in < 10 minutes

1. **Create project** → `my-todo-app`.  
2. **Add table** (via UI or SQL):

   ```sql
   create table public.todos (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null,
     title text not null,
     completed boolean default false,
     inserted_at timestamp with time zone default now()
   );

   alter table public.todos enable row level security;
   create policy "owners can CRUD" on public.todos
     for all
     using (auth.uid() = user_id);
   ```

3. **Enable email auth** → Email + password + magic link.  
4. **Frontend** – React + Vite:

   ```bash
   npm create vite@latest todo-app --template react-ts
   cd todo-app
   npm i @supabase/supabase-js
   ```

   Add `.env`:

   ```
   VITE_SUPABASE_URL=https://<project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=public-anon-key
   ```

   Minimal UI:

   ```tsx
   // src/App.tsx
   import { useEffect, useState } from 'react';
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

   function App() {
     const [session, setSession] = useState<any>(null);
     const [todos, setTodos] = useState<any[]>([]);
     const [newTitle, setNewTitle] = useState('');

     // Auth state listener
     useEffect(() => {
       supabase.auth.getSession().then(({ data }) => setSession(data.session));
       const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
       return () => authListener?.unsubscribe();
     }, []);

     // Load todos for the logged‑in user
     const loadTodos = async () => {
       if (!session) return;
       const { data, error } = await supabase.from('todos').select('*').order('inserted_at', { ascending: false });
       if (!error) setTodos(data);
     };

     // Re‑load when session changes
     useEffect(() => { loadTodos(); }, [session]);

     // Insert a new todo
     const addTodo = async () => {
       if (!newTitle) return;
       await supabase.from('todos').insert({ user_id: session?.user?.id, title: newTitle });
       setNewTitle('');
       loadTodos();
     };

     // Toggle complete
     const toggle = async (id: string, completed: boolean) => {
       await supabase.from('todos').update({ completed: !completed }).eq('id', id);
       loadTodos();
     };

     // UI
     return (
       <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
         <h1>Supabase Todo Demo</h1>
         {!session ? (
           <button onClick={() => supabase.auth.signInWithPassword({ email: 'test@example.com', password: 'password' })}>
             Sign in (test)
           </button>
         ) : (
           <>
             <p>Welcome, {session.user.email}</p>
             <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New todo…" />
             <button onClick={addTodo}>Add</button>
             <ul>
               {todos.map((t) => (
                 <li key={t.id}>
                   <input type="checkbox" checked={t.completed} onChange={() => toggle(t.id, t.completed)} />
                   {t.title}
                 </li>
               ))}
             </ul>
             <button onClick={() => supabase.auth.signOut()}>Log out</button>
           </>
         )}
       </div>
     );
   }

   export default App;
   ```

5. **Run** – `npm run dev`.  

You now have a **full‑stack** Todo app with **auth**, **database**, **realtime updates** (if you add a subscription), **storage** (for attachments), and **edge functions** (if you want to email a daily summary) – all powered by Supabase, and you didn’t write any backend code.

---

## TL;DR – One‑sentence summary

> Supabase is an open‑source Firebase‑like platform built on PostgreSQL that instantly gives you a secure database, real‑time API, authentication, file storage, and edge functions—all controllable via SQL and a simple client SDK.

---

### Want to dive deeper?

| Resource | Why it helps |
|----------|--------------|
| **Supabase Docs – Quickstart** | Walk‑throughs for React, Next.js, Flutter, etc. |
| **“Supabase in Production”** (blog series) | Real‑world scaling tips, backups, and monitoring. |
| **PostgREST docs** | Understand how the auto‑generated REST endpoints work. |
| **RLS Primer** | Learn to write secure policies (`auth.uid()`). |
| **Edge Functions Cookbook** | Sample Deno scripts for webhooks, AI inference, email, etc. |
| **Self‑hosting guide** | Docker‑compose, Kubernetes Helm charts, Terraform module. |

Feel free to ask if you’d like a deeper dive on any piece—e.g., writing advanced Row‑Level Security policies, using Supabase with GraphQL, or self‑hosting the stack on AWS. Happy building!

---

## Short answer  

**Yes.** There are several open‑source “Backend‑as‑a‑Service” (BaaS) stacks that you can spin up on a laptop, a local VM, or any on‑premise server.  
If you want something that feels like Supabase (PostgreSQL + auto‑generated API + auth + realtime + storage + functions) the most popular drop‑in alternatives are:

| Alternative | Core DB | API style | Auth | Realtime | File storage | Serverless / custom logic | How you run it locally |
|-------------|---------|-----------|------|----------|--------------|---------------------------|------------------------|
| **Appwrite** | MariaDB / PostgreSQL (you pick) | REST (JSON) + optional GraphQL | Built‑in (email, OAuth, JWT, magic‑link) | Built‑in (WebSocket) | S3‑compatible (or local FS) | Functions run as Docker containers (any language) | `docker compose up` (official compose file) |
| **Parse Server** | PostgreSQL or MongoDB | REST (JSON) + GraphQL (optional) | Built‑in (username/password, OAuth, anonymous) | LiveQuery (WebSocket) | Files stored on FS or S3 | Cloud Code (Node.js) | `docker run parseplatform/parse-server` or `docker‑compose` |
| **Hasura + Postgres** | PostgreSQL | GraphQL (queries + subscriptions) | External (JWT, Auth0, Supabase GoTrue, etc.) | Subscriptions (GraphQL) | No built‑in storage (plug‑in S3) | Event triggers → Webhooks / Serverless | `docker compose up hasura postgres` |
| **Nhost (open‑source)** | PostgreSQL | GraphQL (Hasura) + REST via Hasura‑Actions | GoTrue (same as Supabase) | GraphQL subscriptions | S3‑compatible | Functions (Deno) | `nhost up` (CLI) – spins up Hasura, Postgres, GoTrue, Storage, Functions |
| **PocketBase** | SQLite (embedded) | REST‑like (JSON) + realtime (WebSocket) | Built‑in (email/password, OAuth) | Realtime over WebSocket | Files stored locally (or S3 via custom) | No built‑in functions (you add a separate API) | Single binary `pocketbase serve` |
| **Directus** | MySQL / PostgreSQL / SQLite | REST + GraphQL (optional) | Built‑in (email, OAuth, JWT) | WebSocket (via hooks) | Files on FS or S3 | Hooks (Node.js) | `docker compose up` (official image) |
| **Firebase Emulator Suite** | Firestore / Realtime DB (local) | Firestore/Realtime DB API (REST + SDK) | Auth emulator (email, OAuth, custom) | Real‑time listeners (local) | Storage emulator (local files) | Functions emulator (Node.js) | `firebase emulators:start` (requires Node) |
| **LocalStack** (AWS) | DynamoDB (local), S3 (local), etc. | AWS SDK (REST) | Cognito (local) | DynamoDB Streams → Lambda (local) | S3 (local) | Lambda (Node, Python, Go) | `docker compose up localstack` |
| **Supabase (self‑hosted)** | PostgreSQL | REST (PostgREST) + GraphQL (optional) | GoTrue (same as SaaS) | Realtime (Elixir) | Storage (S3‑compatible) | Edge Functions (Deno) | `supabase start` (Docker) |

Below you’ll find a **deeper dive** into each option, plus a quick guide on how to get them running on a single machine. Choose the one that matches the tech stack you’re comfortable with and the features you actually need.

---

## 1. Appwrite

**What it is:** An open‑source BaaS that bundles a database, auth, storage, realtime, and serverless functions. It’s designed to be a “Firebase‑like” experience but runs everywhere you can run Docker.

### Core components

| Piece | Tech | Role |
|-------|------|------|
| **Database** | MariaDB (default) – can be swapped for PostgreSQL | Stores collections (documents). |
| **Auth** | Custom JWT‑based system, OAuth 2.0, magic‑link, email verification | Handles sign‑up/sign‑in. |
| **Storage** | S3‑compatible object store (or local file system) | Buckets, signed URLs. |
| **Realtime** | WebSocket service built on top of the DB’s change feed | Pushes insert/update/delete events. |
| **Functions** | Docker containers (any language) triggered by HTTP, DB events, schedule, or realtime. |
| **SDKs** | JavaScript/TS, Flutter, React‑Native, Unity, Go, .NET, etc. |

### Running locally (Docker)

```bash
# Grab the official compose file (includes DB, Redis, and Appwrite)
curl -L https://github.com/appwrite/appwrite/raw/master/docker-compose.yml -o docker-compose.yml
docker compose up -d
# The UI is at http://localhost:80 and the API at http://localhost/v1
```

**Why you might pick it**

- Very easy “single‑command” local dev experience.
- Full feature set (Auth + Storage + Functions) out‑of‑the‑box.
- Language‑agnostic functions (any Docker image).
- Good documentation and active community.

**Things to consider**

- Uses MariaDB by default; if you need PostgreSQL you have to replace it manually.
- Real‑time is built on top of a change‑feed that may not be as low‑latency as Supabase’s Elixir Realtime for massive fan‑out.
- The UI (Appwrite Console) is powerful but not as “SQL‑first” as Supabase Studio.

---

## 2. Parse Server

**What it is:** A mature, open‑source backend originally created by Facebook and now community‑maintained. It offers a classic “Parse” BaaS with a focus on **REST**, **GraphQL**, **LiveQuery** realtime, **Cloud Code**, and **file storage**.

### Core components

| Piece | Tech | Role |
|-------|------|------|
| **Database** | PostgreSQL, MongoDB, MySQL, SQLite | Stores objects (tables). |
| **Auth** | Username/password, email verification, OAuth, anonymous | JWT (session token) based. |
| **Storage** | Files stored on local FS or S3 | Buckets, file ACLs. |
| **Realtime** | LiveQuery – WebSocket subscription to query changes. |
| **Cloud Code** | Node.js scripts (HTTP triggers, afterSave, beforeDelete, scheduled jobs). |
| **SDKs** | JavaScript, iOS, Android, React Native, Unity, .NET, etc. |

### Running locally (Docker)

```bash
docker run -d \
  --name parse-server \
  -p 1337:1337 \
  -e PARSE_SERVER_DATABASE_URI="postgres://postgres:postgres@db:5432/parse" \
  -e PARSE_SERVER_APPLICATION_ID="myAppId" \
  -e PARSE_SERVER_MASTER_KEY="myMasterKey" \
  parseplatform/parse-server
# You’ll also need a Postgres container:
docker run -d --name db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
```

Or use the official **docker‑compose** from the repo for a full stack (Server + Dashboard + DB).

**Why you might pick it**

- Very stable, production‑tested for many years.
- Cloud Code gives you full Node.js runtime without extra containers.
- Built‑in GraphQL (optional) and a mature REST API.
- Good for mobile‑first apps (iOS/Android SDKs are first‑class).

**Things to consider**

- The data model is document‑oriented; complex relational queries need manual joins or view tables.
- LiveQuery works well for moderate traffic but can become a bottleneck under heavy fan‑out.
- The admin UI (Parse Dashboard) is functional but not as polished as Supabase Studio.

---

## 3. Hasura (GraphQL Engine)

**What it is:** A high‑performance **GraphQL** engine that sits on top of PostgreSQL (or other databases). It gives you instant, type‑safe GraphQL queries, **real‑time subscriptions**, and **event triggers** (webhooks) for serverless logic.

### Core components

| Piece | Tech | Role |
|-------|------|------|
| **Database** | PostgreSQL (any version ≥10) | Source of truth, holds tables, triggers, extensions. |
| **GraphQL API** | Hasura GraphQL Engine (C++) | Auto‑generates queries, mutations, subscriptions. |
| **Auth** | External – JWT, Auth0, Firebase, Supabase GoTrue, etc. | Hasura reads JWT claims to enforce Row‑Level Security. |
| **Realtime** | GraphQL subscriptions (uses Postgres logical replication) | Low‑latency push for any query. |
| **Event Triggers** | Webhooks → any HTTP endpoint (e.g., Lambda, Cloudflare Workers) | Serverless actions on INSERT/UPDATE/DELETE or scheduled cron. |
| **Remote Schemas** | Merge external GraphQL services | Extends API with custom business logic. |
| **Metadata** | YAML/JSON stored in the DB, can be version‑controlled. |
| **SDKs** | Any GraphQL client (Apollo, urql, Relay). |

### Running locally (Docker)

```bash
docker compose up -d
# docker-compose.yml (simplified)
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
  hasura:
    image: hasura/graphql-engine:v2.36.0
    depends_on: [postgres]
    ports: ["8080:8080"]
    environment:
      HASURA_GRAPHQL_DATABASE_URL: postgres://postgres:postgres@postgres:5432/postgres
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_DEV_MODE: "true"
```

Navigate to `http://localhost:8080/console` for the UI.

**Why you might pick it**

- **GraphQL first**: If your front‑end already uses GraphQL, Hasura gives you a type‑safe API without writing resolvers.
- **Realtime is baked in** – every GraphQL query can be turned into a subscription with a single flag.
- **Row‑Level Security** integrates directly with PostgreSQL’s native RLS, just like Supabase.
- **Event triggers** let you run serverless code without a full Function-as-a-Service platform.

**Things to consider**

- No built‑in **auth** or **file storage** – you need to add GoTrue (or another JWT provider) and an S3 bucket separately.
- You’ll need to write **custom resolvers** (Remote Schemas or Actions) for complex business logic that can’t be expressed in SQL.
- If you prefer a pure REST API, you’ll have to add PostgREST or another layer.

---

## 4. Nhost (Open‑source edition)

**What it is:** A “Supabase‑ish” stack that bundles **PostgreSQL**, **Hasura GraphQL Engine**, **GoTrue**, **Storage**, and **Edge Functions**. The hosted SaaS version is commercial, but the core services are open‑source and can be run locally via the `nhost` CLI.

### Core components (same as Supabase, but GraphQL‑centric)

| Piece | Tech | Role |
|-------|------|------|
| **DB** | PostgreSQL | Primary data store. |
| **Auth** | GoTrue (identical to Supabase) | Email, OAuth, magic‑link, JWT. |
| **API** | Hasura GraphQL Engine | Queries, mutations, subscriptions. |
| **Storage** | S3‑compatible (MinIO in dev) | Buckets, signed URLs. |
| **Functions** | Deno runtime (Edge Functions) | HTTP endpoints, can be triggered from GraphQL actions. |
| **CLI** | `nhost` (Node) | Starts all services via Docker Compose. |

### Running locally (CLI)

```bash
# Install the CLI (npm)
npm i -g nhost

# Initialise a new project in the current folder
nhost init

# Start all services
nhost up
# UI at http://localhost:1337 (Hasura console) and http://localhost:4000 (Auth/Storage)
```

**Why you might pick it**

- **All‑in‑one**: You get the same pieces Supabase offers, but with GraphQL as the primary API (plus optional REST via Hasura’s `GET /rest`).
- Uses **GoTrue** for auth, so the JWT format and policies are identical to Supabase—easy migration.
- Edge Functions are Deno‑based, same as Supabase’s Edge Functions (so you can reuse code).

**Things to consider**

- The open‑source edition is **self‑hosted**; the hosted SaaS version adds extra features (like email templates) that you’d have to implement yourself locally.
- If you’re strictly looking for a **REST** API, you’ll need to enable Hasura’s REST endpoint or add PostgREST.
- The community is smaller than Supabase’s, though it’s growing fast.

---

## 5. PocketBase

**What it is:** A tiny, **single‑binary** backend written in Go. It uses an embedded SQLite database, provides a REST‑like API, real‑time subscriptions, authentication, and file storage—all in a 30‑MB executable.

### Core components

| Piece | Tech | Role |
|-------|------|------|
| **DB** | SQLite (embedded) | Stores collections (tables). |
| **API** | HTTP JSON (REST‑like) + WebSocket for realtime | CRUD operations are one‑line calls. |
| **Auth** | Email/password, OAuth (via external provider), JWT | Session management. |
| **Realtime** | WebSocket that pushes changes for subscribed collections. |
| **Storage** | Local filesystem (or S3 via custom middleware). |
| **Admin UI** | Built‑in web console (`/_/`) | Manage collections, users, files. |
| **Extensibility** | You can embed PocketBase as a library in Go apps or run custom Go plugins. | No built‑in functions, but you can run a separate API server that talks to the same SQLite DB. |

### Running locally (single binary)

```bash
# Download the binary for your OS
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.21.5/pocketbase_0.21.5_linux_amd64.zip -o pb.zip
unzip pb.zip
./pocketbase serve
# Admin UI at http://127.0.0.1:8090/_/
```

**Why you might pick it**

- **Ultra‑lightweight**: No Docker, no extra services—just one binary.
- Great for **offline‑first** desktop or mobile apps where you want a local server for sync.
- Built‑in admin UI is excellent for rapid prototyping.
- SQLite means zero‑configuration and easy bundling.

**Things to consider**

- Not designed for **high‑concurrency** or massive scale; SQLite locks can become a bottleneck under heavy write load.
- No built‑in **serverless functions**—you need to implement custom logic elsewhere.
- The **auth** system is simpler; no built‑in OAuth provider management (you have to add your own flow).
- No built‑in **email sending** or advanced password‑reset flows (you can plug in an SMTP server).

---

## 6. Directus

**What it is:** An open‑source **headless CMS** that sits on top of an existing SQL database (MySQL, PostgreSQL, SQLite, MariaDB). It auto‑generates a **REST** and **GraphQL** API, includes a data model UI, role‑based permissions, and file storage.

### Core components

| Piece | Tech | Role |
|-------|------|------|
| **DB** | MySQL / PostgreSQL / SQLite | Stores the raw tables you define. |
| **API** | REST (OpenAPI) + GraphQL (optional) | Auto‑generated CRUD endpoints. |
| **Auth** | Email/password, OAuth, JWT, LDAP | Role‑based permissions at collection/field level. |
| **Storage** | Files stored locally or on S3 (via config). |
| **Realtime** | WebSocket notifications for changes (optional via hooks). |
| **Hooks / Extensions** | Node.js (express‑style) custom endpoints, lifecycle hooks. |
| **Admin UI** | Rich React UI for schema design, data editing, media library. |

### Running locally (Docker)

```bash
docker run -d \
  -p 8055:8055 \
  -e KEY=YOUR_RANDOM_KEY \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_PASSWORD=SuperSecret123 \
  -e DB_CLIENT=pg \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_DATABASE=directus \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  directus/directus

# And a postgres container:
docker run -d --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres
```

**Why you might pick it**

- Ideal if you already have an existing relational schema and just need an **admin UI + API** on top of it.
- Granular **field‑level permissions**—great for multi‑tenant SaaS.
- The GraphQL endpoint is optional but handy.
- Good for content‑heavy sites (CMS, e‑commerce catalogs).

**Things to consider**

- It’s more of a **CMS** than a full BaaS; it doesn’t include auth‑only features like password‑reset emails out‑of‑the‑box (you can add via hooks).
- Real‑time is not as robust as Supabase’s Realtime; you typically poll or use webhook‑to‑WebSocket adapters.
- Storage is secondary; you’ll often pair Directus with a separate S3 bucket for heavy media.

---

## 7. Firebase Emulator Suite

**What it is:** Google’s official **local emulation** of Firebase services. It’s not a production‑ready self‑hosted solution, but it lets you develop entirely offline with the same SDKs you’d use in production.

### Services you can emulate

| Service | What you get locally | Typical use case |
|---------|---------------------|-----------------|
| **Firestore** | NoSQL document store (with indexes) | App data, offline sync. |
| **Realtime Database** | Legacy JSON tree DB | Simple realtime apps. |
| **Auth** | Email/password, OAuth providers (Google, GitHub, etc.) | User management. |
| **Functions** | Node.js (or TypeScript) Cloud Functions | Serverless backend. |
| **Storage** | File storage on local filesystem | Media uploads. |
| **Hosting** | Static site server | Front‑end preview. |
| **Pub/Sub** (beta) | Message bus | Event‑driven workflows. |

### Running locally

```bash
# Install the Firebase CLI
npm i -g firebase-tools

# Initialize a project (choose which emulators you need)
firebase init emulators

# Start them
firebase emulators:start
```

The UI is at `http://localhost:4000` (Emulator UI).

**Why you might pick it**

- **Zero‑config** if you’re already using Firebase in production.
- All SDKs (Web, iOS, Android) work identically in the emulator.
- Great for unit/integration testing with a real backend.

**Things to consider**

- The emulator is **not a production deployment**; you can’t ship it to your own servers for end‑users.
- It only supports **Firebase‑specific data models** (Firestore/Realtime DB), not relational PostgreSQL.
- You’ll still need a separate production backend (Firebase Cloud) if you go to production.

---

## 8. LocalStack (AWS emulator)

**What it is:** A fully‑featured local mock of **AWS services**. It gives you local DynamoDB, S3, Cognito, Lambda, API Gateway, SNS, SQS, and more.

### Services relevant to a Supabase‑style stack

| Service | Supabase equivalent | Notes |
|---------|--------------------|-------|
| **DynamoDB** | PostgreSQL (relational) | No SQL joins, but great for key‑value workloads. |
| **S3** | Supabase Storage | Object storage (local FS). |
| **Cognito** | GoTrue (Auth) | JWT‑based user pool, supports OAuth. |
| **Lambda** | Edge Functions | Runs Node.js, Python, Go, etc. |
| **API Gateway** | HTTP endpoint for functions | Can expose Lambda as REST or GraphQL. |
| **EventBridge** | Hasura/ Supabase event triggers | Event routing. |

### Running locally

```bash
docker compose up -d localstack
# The container runs many services on ports 4566 (edge) and 4571 (S3 UI)
```

You then configure your AWS SDKs to point to `http://localhost:4566`.

**Why you might pick it**

- If your production stack is **AWS‑centric**, you can develop against the same APIs locally.
- You can combine DynamoDB (NoSQL) with S3, Cognito, Lambda – essentially a full BaaS on your own hardware.
- Works well with the **Serverless Framework**, **SAM**, or **CDK** for IaC.

**Things to consider**

- It’s **AWS‑centric**: you’ll have to translate relational queries into DynamoDB patterns or add a local Postgres container yourself.
- Some services (e.g., Cognito) are **partial** in the emulator; not all features (like advanced MFA) are fully implemented.
- You’ll need to manage IAM‑style policies yourself.

---

## 9. Supabase (self‑hosted) – a reminder

Supabase’s own stack is **open source** and can be run locally with a single command:

```bash
# Install the CLI (npm or brew)
npm i -g supabase

# Spin up all services locally (Postgres, Realtime, GoTrue, Storage, Studio)
supabase start
```

This gives you exactly the same developer experience as the hosted service, but you control the hardware, backups, and any custom extensions (e.g., PostGIS, pgvector). If you simply want “Supabase locally” you don’t need a different platform.

---

## 10. Quick‑start cheat sheet

| Goal | Recommended stack | One‑liner to start |
|------|------------------|--------------------|
| **Full Firebase‑like BaaS (REST + Realtime + Auth + Storage + Functions)** | **Appwrite** | `curl -L https://raw.githubusercontent.com/appwrite/appwrite/master/docker-compose.yml -o docker-compose.yml && docker compose up -d` |
| **GraphQL‑first with PostgreSQL** | **Hasura** (add GoTrue & MinIO if you need auth & storage) | `docker compose up -d` (see Hasura example above) |
| **Lightweight, single binary, SQLite** | **PocketBase** | `wget https://github.com/pocketbase/pocketbase/releases/download/v0.21.5/pocketbase_0.21.5_linux_amd64.zip && unzip && ./pocketbase serve` |
| **Classic BaaS with Cloud Code (Node)** | **Parse Server** | `docker run -d -p 1337:1337 -e PARSE_SERVER_DATABASE_URI="postgres://postgres:postgres@db:5432/parse" -e PARSE_SERVER_APPLICATION_ID="myAppId" -e PARSE_SERVER_MASTER_KEY="myMasterKey" parseplatform/parse-server` |
| **CMS‑style API on existing SQL DB** | **Directus** | `docker run -d -p 8055:8055 -e KEY=... -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... -e DB_CLIENT=pg -e DB_HOST=postgres -e DB_PORT=5432 -e DB_DATABASE=directus -e DB_USER=postgres -e DB_PASSWORD=postgres directus/directus` |
| **AWS‑style stack** | **LocalStack** | `docker compose up -d localstack` |
| **Firebase‑compatible local dev** | **Firebase Emulator Suite** | `npm i -g firebase-tools && firebase init emulators && firebase emulators:start` |
| **Supabase‑exact clone** | **Supabase (self‑hosted)** | `supabase start` |
| **GraphQL + Auth + Storage in one CLI** | **Nhost (open‑source)** | `npm i -g nhost && nhost init && nhost up` |

---

## Decision matrix – picking the right tool

| Feature | Appwrite | Parse | Hasura | Nhost | PocketBase | Directus | Firebase Emu | LocalStack | Supabase (self‑host) |
|---------|----------|-------|--------|-------|------------|----------|--------------|------------|----------------------|
| **Database type** | MariaDB / Postgres (optional) | Postgres / Mongo / MySQL | PostgreSQL | PostgreSQL | SQLite | MySQL / Postgres / SQLite | Firestore (NoSQL) | DynamoDB (NoSQL) | PostgreSQL |
| **API style** | REST (JSON) | REST + optional GraphQL | GraphQL (subscriptions) | GraphQL (Hasura) + optional REST | REST‑like + WS | REST + optional GraphQL | Firestore SDK (REST+gRPC) | AWS SDK (REST) | REST (PostgREST) + optional GraphQL |
| **Realtime** | WS (change feed) | LiveQuery (WS) | GraphQL subscriptions | GraphQL subscriptions | WS | WS (notifications) | SDK listeners | DynamoDB Streams → Lambda | WS (Elixir) |
| **Auth** | Built‑in (JWT) | Built‑in (session token) | External (JWT) | GoTrue (same as Supabase) | Built‑in (JWT) | Built‑in (JWT) | Built‑in (JWT) | Cognito (JWT) | GoTrue |
| **File storage** | S3 / FS | S3 / FS | External (S3) | S3 / MinIO | FS (or S3 via plugin) | S3 / FS | S3‑compatible (emulated) | S3 (local) | S3‑compatible (MinIO) |
| **Serverless / custom logic** | Docker containers (any language) | Cloud Code (Node) | Webhooks / Hasura Actions (any) | Deno Edge Functions | No built‑in (use separate API) | Node hooks | Node (Functions) | Deno Edge Functions | Deno Edge Functions |
| **Self‑host complexity** | Easy (Docker) | Easy (Docker) | Moderate (Postgres + Hasura) | Easy (`nhost up`) | Trivial (binary) | Easy (Docker) | Easy (CLI) | Moderate (Docker) | Easy (`supabase start`) |
| **Community / docs** | Growing fast | Mature (10+ yr) | Very active (GraphQL) | Small but expanding | Small but friendly | Good (CMS) | Official Google | Good (AWS) | Large (Supabase) |
| **Best for** | “Firebase‑style” all‑in‑one, language‑agnostic functions | Mobile‑first apps, existing Parse clients | GraphQL‑centric SPAs, high‑performance realtime | Supabase‑like stack with GraphQL | Ultra‑light local dev or desktop apps | Content‑heavy sites, admin UI needed | Existing Firebase projects that need offline dev | Teams already on AWS wanting local dev | Anyone who already loves Supabase’s workflow and wants full control |

---

## How to choose – a quick checklist

1. **Do you need a relational DB?**  
   - **Yes** → Hasura, Nhost, Supabase, Directus, Parse (Postgres), Appwrite (Postgres).  
   - **No / OK with NoSQL** → Firebase Emulator, LocalStack (DynamoDB), Appwrite (MariaDB) if you can tolerate non‑relational.

2. **Do you want a GraphQL API out of the box?**  
   - **Yes** → Hasura, Nhost, Directus (optional), Supabase (optional via PostgREST GraphQL).  
   - **Prefer REST** → Appwrite, Parse, PocketBase, Supabase (PostgREST).

3. **Realtime is a must?**  
   - **Low‑latency pub/sub** → Supabase Realtime, Hasura Subscriptions, Appwrite WS, PocketBase WS, Parse LiveQuery.  
   - **Only occasional updates** → Firebase Realtime/Firestore, LocalStack (via DynamoDB Streams).

4. **Do you need built‑in serverless functions?**  
   - **Yes** → Appwrite, Supabase Edge Functions, Nhost Edge Functions, Parse Cloud Code, Firebase Functions, LocalStack Lambda.  
   - **Not needed** → Directus, PocketBase, Hasura (use external webhooks).

5. **Do you already have a cloud provider lock‑in?**  
   - **AWS** → LocalStack (local dev) + eventual deployment to real AWS.  
   - **Google** → Firebase Emulator.  
   - **None / want vendor‑agnostic** → Appwrite, Parse, Hasura, Nhost, PocketBase, Supabase.

6. **How much operational overhead can you accept?**  
   - **Zero** (single binary) → PocketBase.  
   - **Low** (Docker compose of 3–5 containers) → Appwrite, Parse, Supabase, Directus.  
   - **Medium** (Postgres + Hasura + optional services) → Hasura, Nhost.

7. **Do you need an admin UI for content editors?**  
   - **Yes** → Directus, Supabase Studio, Appwrite Console, Parse Dashboard, PocketBase UI.  
   - **No** → Hasura (console for schema only), Nhost (GraphQL console), Firebase (no admin UI for data).

---

## Example migration paths

### From Supabase → Appwrite (REST‑centric)

| Supabase feature | Appwrite equivalent | Migration steps |
|------------------|--------------------|-----------------|
| PostgreSQL tables | Appwrite collections (MariaDB) | Export schema (`pg_dump`), import via Appwrite’s import API or write migration scripts. |
| PostgREST endpoints | Appwrite REST API (`/v1/collections/:id/documents`) | Update client SDK calls (`supabase.from('todos').select()` → `appwrite.database.listDocuments('todos')`). |
| Realtime (`realtime.subscribe`) | Appwrite Realtime (`appwrite.realtime.subscribe`) | Change event names accordingly. |
| GoTrue auth | Appwrite Auth (`account.create`, `account.createSession`) | Adjust sign‑in/up flows; JWT format differs but you can still verify on the server. |
| Storage bucket | Appwrite Storage (`buckets.create`) | Re‑upload files or copy from S3 bucket. |
| Edge Functions | Appwrite Functions (Docker) | Port Deno functions to Docker images (Node, Go, etc.) or keep Deno via custom container. |

### From Firebase → Supabase (if you need SQL)

| Firebase feature | Supabase equivalent | Migration steps |
|------------------|--------------------|-----------------|
| Firestore collections | PostgreSQL tables (via `supabase db push`) | Export Firestore data (`gcloud firestore export`) → convert JSON to CSV → `COPY` into Postgres. |
| Firebase Auth | Supabase GoTrue | Export users via Firebase Admin SDK, import into Supabase with `supabase auth import`. |
| Cloud Functions | Edge Functions | Rewrite functions in Deno (or Node) and deploy with `supabase functions deploy`. |
| Firebase Storage | Supabase Storage (MinIO) | Copy objects from Google Cloud Storage to MinIO using `gsutil rsync` → MinIO. |
| Realtime listeners | Supabase Realtime (WebSocket) | Change client code from Firestore SDK to Supabase JS SDK (`supabase.from('todos').on('INSERT', ...)`). |

---

## TL;DR – Which local BaaS should you spin up right now?

| Situation | Recommended local stack |
|-----------|--------------------------|
| **I want the simplest thing to run on a laptop, with a UI, REST API, auth, realtime, and file storage** | **Appwrite** (`docker compose up -d`). |
| **My app already uses GraphQL heavily; I need PostgreSQL + subscriptions** | **Hasura** (add GoTrue + MinIO if you need auth + storage). |
| **I need a tiny, zero‑dependency binary for an embedded app** | **PocketBase** (single executable). |
| **I’m building a classic mobile app with Cloud Code and want Node.js serverless** | **Parse Server** (Docker). |
| **I love Supabase but want a self‑hosted dev environment** | **Supabase (self‑hosted)** – `supabase start`. |
| **I want a headless CMS on top of an existing Postgres/MySQL schema** | **Directus** (Docker). |
| **My production stack is AWS and I want to develop locally with the same APIs** | **LocalStack** (Docker). |
| **I’m already using Firebase in prod and just need an offline dev environment** | **Firebase Emulator Suite** (`firebase emulators:start`). |
| **I love Supabase’s GraphQL‑plus‑REST combo and want a single‑CLI dev experience** | **Nhost (open‑source)** (`nhost up`). |

All of the above run locally with Docker (or a single binary) and can be persisted to disk so you can keep data across restarts. Choose the one that aligns with your **data model**, **API style**, **real‑time needs**, and **deployment preferences**—and you’ll have a full backend on your own machine without any cloud lock‑in. Happy hacking! 🚀
