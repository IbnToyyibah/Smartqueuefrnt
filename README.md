# SmartQueue

SmartQueue is a real-time queue management system for organizations that serve customers at physical branches. Customers can find a branch, join a service queue, and follow their ticket, while staff and administrators manage service counters and monitor branch activity.

The application is an MVP built as a React single-page app and an Express API. The frontend lives in `smartqueue/`; the backend is in the sibling `server/` directory.

## MVP features

- **Customer queue access:** browse branches and services, join a queue with or without an account, receive a ticket with a QR code, and look up or track queue progress.
- **Live queue updates:** see ticket status, queue position, estimated wait, and public branch display boards update in real time.
- **Staff workflows:** view the branch queue, call the next ticket, and mark tickets served, no-show, skipped, recalled, or transferred between counters.
- **Branch administration:** manage branch details, services, counters, staff, queue activity, analytics, and reports.
- **Platform administration:** oversee branches and users, manage permissions and system settings, review audit logs, and manage branch subscriptions.
- **Notifications:** in-app notifications, with optional transactional email through Brevo and SMS through Twilio.
- **Access control:** role-based experiences for customers, staff, branch administrators, and super administrators.

## Technology

| Area | Stack |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, Socket.IO |
| Data | Supabase |
| Queue extras | QR code generation, optional Brevo email and Twilio SMS |

## Project layout

text
SmartQueue/
├── server/             # Express API, queue services, and Socket.IO server
└── smartqueue/         # React/Vite frontend (this directory)
```

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- A Supabase project configured for the backend's application data
- Optional: Brevo credentials for email and Twilio credentials for SMS

## Run locally

Open two terminals from the project root.

### 1. Configure and start the backend

Create `server/.env` from `server/.env.example` and set at least:

```

Then install dependencies and start the API:

```sh
cd server
npm install
npm run dev
```

The API listens on port `5001` by default. Its basic health check is available at `http://localhost:5001/health`.

### 2. Configure and start the frontend

Create `smartqueue/.env` from `smartqueue/.env.example`. The default `VITE_API_URL=/api` uses the Vite development proxy; no additional API URL is needed for local development.

```sh
cd smartqueue
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

### Optional notification providers

Add these to `server/.env` only if you want to enable outbound notifications:

```dotenv
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=SmartQueue

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

Keep secrets in local environment files; do not commit them.

## Scripts

Run these commands from the relevant application directory:

| Directory | Command | Purpose |
| --- | --- | --- |
| `smartqueue/` | `npm run dev` | Start the Vite development server |
| `smartqueue/` | `npm run build` | Create the production frontend build in `dist/` |
| `smartqueue/` | `npm run preview` | Preview the production frontend build |
| `smartqueue/` | `npm run lint` | Run ESLint |
| `server/` | `npm run dev` | Start the API with Nodemon |
| `server/` | `npm start` | Start the API |
| `server/` | `npm run seed` | Run the backend seed script |

## API and real-time services

The backend exposes its API under `/api`, including authentication, queue, branch, counter, user, notification, and analytics routes. Socket.IO is used for live queue events and display updates. The Vite development server proxies `/api` and `/socket.io` to the backend.

Useful endpoints:

- `GET /health` — backend health and database readiness
- `GET /api/health` — API health and database readiness
- `GET /api/health/db` — database backend status

## Deployment notes

- Build the frontend with `npm run build` from `smartqueue/` and deploy the generated `dist/` directory to a static hosting provider.
- Run the Express application from `server/` on a Node.js host and configure the production environment variables there.
- Set the frontend API URL and, where applicable, Socket.IO URL for the deployed backend. Configure the backend's `CLIENT_URL` or `CLIENT_URLS` to allow the deployed frontend origin.
- The frontend includes Vercel rewrite configuration, and the Vite development proxy is for local development only.

## MVP scope

SmartQueue is an MVP and requires a configured Supabase project and production service credentials for deployed use. Email and SMS delivery are optional integrations; queue management and in-app workflows do not require those providers.
