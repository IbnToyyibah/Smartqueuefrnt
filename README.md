# SmartQueue

**Stop standing in line. Hold your place from your phone.**

SmartQueue turns the paper-ticket queue at a hospital, bank, tax office or shop into a live digital line. A customer picks a branch and a service, gets a QR ticket like `A014`, and watches their position count down in real time. Meanwhile the counter agent calls them with one click and the lobby TV announces which counter to go to.

Live: <https://smartqueues-chi.vercel.app>

---

## What makes it different

- **No account needed to queue.** Guests join with a name and email and track the ticket by its number. Signing up adds history, ratings and in-app notifications.
- **One line per branch, many counters.** Every counter calls from the same fair, first-come line. A skipped customer goes to the back, and a transferred customer keeps their place.
- **Waits based on the actual services.** The estimate adds up the length of every service ahead of you, so three 20-minute loan consultations count for more than three 8-minute enquiries.
- **Lobby display mode.** `/queue/:branchId` is a full-screen board for a TV in the waiting room. It shows ticket numbers and counters only, never names or phone numbers.
- **Built for different sectors.** New branches start with a service catalogue that matches their category: healthcare (consultation, pharmacy, X-ray, lab, emergency), banking, government or retail.
- **Branches run on subscriptions.** Branch admins get a 14-day trial. When a branch's trial or subscription lapses, it stops taking new tickets, and customers are told to pick another branch.

---

## Who uses it

| Role | Can do | Starts at |
|---|---|---|
| **Customer / guest** | Find a branch, join a queue, track a ticket live, rate a finished visit | `/find-branch`, `/join-queue`, `/track` |
| **Counter agent** (`staff`) | Call next, serve, mark no-show, skip, recall, transfer, at their assigned counter only | `/staff/dashboard` |
| **Branch admin** | Manage their branch: services, counters, agents, queue overview, analytics | `/admin/branch` |
| **Super admin** | Run the platform: all branches, users, subscriptions, platform analytics | `/admin/super` |

Every rule is enforced on the server. Staff and branch admins can only touch tickets, counters and agents in their own branch.

---

## How a ticket moves

```
            join                    call next               serve
 (guest) ─────────▶  waiting  ───────────────▶  called  ──────────▶  served ─▶ rate ★
                       │  ▲                       │  │
              check in │  │ skip (back of line)   │  └── no-show ──▶ noshow
                       ▼  │                       │
                    checked_in ◀──────────────────┘ recall (call again)
```

- Ticket numbers come from a per-branch sequence (`A001` to `A999`, then `B001`, and so on). A PostgreSQL function `allocate_queue_sequence` allocates them, so two people joining at the same moment never get the same number.
- Positions and estimated waits are recalculated every time the line moves, and the change is pushed to everyone watching.

---

## Architecture

```
┌─────────────────────────┐      REST /api/*       ┌──────────────────────────┐
│  smartqueue/ (this app) │ ─────────────────────▶ │  server/  Express API    │
│  React 19 + Vite 8      │                        │  JWT auth · rate limits  │
│  Tailwind 4 · Framer    │ ◀════ Socket.IO ═════▶ │  Socket.IO rooms         │
└─────────────────────────┘    live queue events   └────────────┬─────────────┘
                                                                │ service key
                                                   ┌────────────▼─────────────┐
                                                   │  Supabase (PostgreSQL)   │
                                                   └──────────────────────────┘
                                         Email via Brevo · SMS via Twilio (optional)
```

The frontend and backend are separate repos and deploy separately. The frontend goes on Vercel, and `vercel.json` forwards `/api/*` to the Render backend. The backend runs on Render.

### Real-time rooms

| Room | Who joins | Receives |
|---|---|---|
| `branch:<id>` | That branch's staff and admins, super admins | Full ticket events |
| `queue:<id>` | Anyone (lobby screens, trackers) | The same events, minus contact details |
| `user:<id>` | The signed-in user only | Personal notifications, session revocation |

Events: `queue:joined`, `queue:called`, `queue:served`, `queue:noshow`, `queue:skipped`, `queue:transferred`, `queue:checkedin`, `queue:updated`, `counter:updated`, `notification:new`, `session:revoked`.

---

## Run it locally

You need **Node.js 18+** and a **Supabase project**. Clone the frontend and backend repos side by side:

```
SmartQueue/
├── server/       # Express API (separate repo)
└── smartqueue/   # this repo
```

**1. Backend**

```bash
cd server
npm install
cp .env.example .env      # fill in SUPABASE_URL, SUPABASE_SECRET_KEY, JWT_SECRET
npm run seed              # optional: demo branches, counters and users (wipes tables!)
npm run dev               # http://127.0.0.1:5001
```

If port 5001 is taken in development, the server moves to the next free port and writes the chosen port to `server/.cache/backend-port.json`. The Vite proxy reads that file, so you never have to edit config.

**2. Frontend**

```bash
cd smartqueue
npm install
cp .env.example .env      # defaults work for local development
npm run dev               # http://localhost:5173
```

**3. Try it**

1. Open `/find-branch`, pick a branch and join a queue as a guest.
2. In another window, sign in as the counter agent and press **Call next**.
3. Open `/queue/<branchId>` on a third screen to see the lobby board update.

Demo accounts created by `npm run seed` (local use only):

| Role | Email | Password |
|---|---|---|
| Super admin | `superadmin@smartqueue.com` | `superadmin123` |
| Branch admin | `admin@smartqueue.com` | `BranchAdmin@123` |
| Counter agent | `staff@smartqueue.com` | `Staff@123` |
| Customer | `customer@smartqueue.com` | `Customer@123` |

> Change these before any shared deployment. The seed script refuses to run when `NODE_ENV=production` unless you also set `ALLOW_DESTRUCTIVE_SEED=true`.

---

## Configuration

### Frontend (`smartqueue/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `/api` | API base URL. Keep `/api` to use the Vite proxy or Vercel rewrites. |
| `VITE_SOCKET_URL` | *(empty)* | Backend origin for Socket.IO. Leave empty to go through the proxy. |
| `VITE_API_PROXY` | *(unset)* | Dev only: proxy `/api` to a remote backend instead of the local one. |

Everything prefixed `VITE_` ends up in the public JavaScript bundle. **Never put API keys here.** Email and SMS are sent by the server.

### Backend (`server/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | yes | Database access (server-side key, never shipped to browsers) |
| `JWT_SECRET` | yes | Signs login tokens. The server will not start without it. |
| `JWT_EXPIRES_IN` | no | Token and cookie lifetime, default `7d` |
| `CLIENT_URL` / `CLIENT_URLS` | prod | Allowed browser origins (comma-separated) |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | no | Ticket and call emails |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | no | SMS alerts |

---

## API at a glance

All routes are under `/api`. Sign-in sets an HttpOnly `sq_token` cookie and also returns a bearer token.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET/PATCH /auth/me` · `POST /auth/change-password` |
| Queue (public) | `POST /queue/join` · `GET /queue/:id` · `GET /queue/lookup/:ticketNumber` · `GET /queue/display/:branchId` |
| Queue (customer) | `GET /queue/my` · `GET /queue/history` · `POST /queue/:id/checkin` · `PATCH /queue/:id/rate` |
| Queue (staff) | `POST /queue/:id/call · serve · noshow · skip · recall · transfer` · `GET /queue/branch/:branchId` |
| Branches | `GET /branches` · `GET /branches/:id` · `GET /branches/:id/services` · admin CRUD for branches and services |
| Counters, users | `/counters` · `/users` (branch admins manage their own agents) |
| Notifications | `GET /notifications` · `PATCH /notifications/:id/read` · `PATCH /notifications/read-all` |
| Analytics | `GET /analytics/branch/:branchId?days=7` · `GET /analytics/platform` |
| Health | `GET /health` · `GET /api/health` |

---

## Scripts

| Where | Command | Does |
|---|---|---|
| `smartqueue/` | `npm run dev` | Vite dev server with API and socket proxy |
| | `npm run build` | Production build to `dist/` |
| | `npm run lint` | ESLint |
| | `npm run preview` | Serve the production build locally |
| `server/` | `npm run dev` | API with auto-restart (nodemon) |
| | `npm start` | API for production |
| | `npm run seed` | Reset the database with demo data |

---

## Project layout

```
smartqueue/src/
├── pages/          customer/ · staff/ · admin/ · auth/ · display/ · Landing.jsx
├── components/     layout/ (Navbar, Sidebar, AppLayout) · ui/ · customer/queue/
├── context/        AuthContext · QueueContext · NotificationContext
├── hooks/          useQueueFlow (multi-step join flow)
└── lib/            api.js (REST client) · socket.js · routes.js · queueHelpers.js

server/src/
├── routes/         auth · queue · branches · counters · users · notifications · analytics
├── services/       queueService (ticket lifecycle, analytics) · notificationService
├── middleware/     auth (roles, branch scoping) · branchActiveCheck · errorHandler
├── socket/         rooms and branch/user broadcasts
├── lib/            supabaseRepo (thin query helpers)
└── utils/          permissions · serviceCatalog · branchSubscription · common
```

---

## Roadmap

- Real payment processing for branch subscriptions (registration currently stores only the card holder, last 4 digits and expiry)
- CSV/PDF export for the Reports page
- Persisted branch and system settings (some admin settings screens are UI-only today)
- Audit log backed by real events
- Predicted wait times learned from each branch's history

## License

No license has been chosen yet. All rights are reserved by the author until one is added.
