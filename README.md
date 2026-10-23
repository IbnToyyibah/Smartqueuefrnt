# SmartQueue
### Real-Time Queue Management System

## Overview

SmartQueue is a real-time queue management system designed to help organizations manage customer queues efficiently across physical branches. It provides a centralized platform where customers can find branches, select services, join queues, receive digital tickets, and monitor their queue progress in real time.

The platform also enables staff to manage service counters, process customer tickets, and monitor queue activity, while branch administrators and platform administrators oversee operations, users, services, analytics, and system configurations.

SmartQueue is developed as a Minimum Viable Product (MVP) using a React-based frontend and an Express.js backend, with Supabase providing data services and Socket.IO enabling real-time communication.

## Key Features

### 1. Customer Queue Management
- Browse available branches and services.
- Join service queues with or without an account.
- Receive digital queue tickets with QR codes.
- Track ticket status and queue position.
- View estimated waiting times and service progress.

### 2. Real-Time Queue Updates
- Receive live updates on ticket status and queue position.
- Monitor estimated waiting times.
- Display current queue information on public branch display boards.
- Synchronize queue activity between customers and staff.

### 3. Staff Operations
- View and manage queues assigned to their branches.
- Call the next customer in line.
- Mark tickets as served, skipped, or no-show.
- Recall tickets when necessary.
- Transfer customers between service counters.

### 4. Branch Administration
- Manage branch information and services.
- Configure service counters.
- Manage branch staff and operational activities.
- Monitor queue performance and customer flow.
- Access analytics and operational reports.

### 5. Platform Administration
- Oversee registered branches and users.
- Manage system permissions and settings.
- Review audit logs.
- Manage branch subscriptions.
- Monitor platform-wide activity.

### 6. Notifications
- Provide in-app notifications.
- Support optional transactional email delivery through Brevo.
- Support optional SMS notifications through Twilio.

### 7. Role-Based Access Control
SmartQueue provides role-specific functionality for:
- Customers
- Service staff
- Branch administrators
- Super administrators

Each role receives access to the relevant features and operational tools.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19 |
| Development and Build Tool | Vite |
| Routing | React Router |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Node.js and Express.js |
| Real-Time Communication | Socket.IO |
| Database and Backend Services | Supabase |
| Ticket Identification | QR Code Generation |
| Email Notifications | Brevo |
| SMS Notifications | Twilio |

Brevo and Twilio are optional integrations and require their respective credentials.

## Project Structure

The project is organized into two primary application directories:

- **server/** — Contains the Express.js API, queue management services, backend logic, and Socket.IO server.
- **smartqueue/** — Contains the React frontend, user interface, routing, styling, and client-side application logic.

This separation supports independent frontend and backend development, testing, and deployment.

## Getting Started

### Prerequisites

Before setting up SmartQueue, ensure that the following are available:

- Node.js and npm
- A configured Supabase project
- The SmartQueue project files
- Environment variables required by the frontend and backend

### Installation and Setup

**1. Configure the backend**

Navigate to the server directory, install the required dependencies, and configure the backend environment variables using the project's environment template.

Provide the necessary Supabase configuration and other required backend settings before starting the API.

**2. Configure the frontend**

Navigate to the smartqueue directory and install the frontend dependencies.

Create the frontend environment file using the provided example configuration. The default API configuration uses the Vite development proxy for local development.

**3. Start the backend**

Run the backend development script from the server directory. This starts the Express API and its associated real-time services.

**4. Start the frontend**

Run the frontend development script from the smartqueue directory. Open the local URL displayed by Vite in your browser.

The frontend normally runs at `http://localhost:5173` during local development.

Refer to the project's environment templates and package scripts for the exact configuration required by your installation.

## Environment Configuration

SmartQueue uses environment variables to configure connections and external services.

The backend requires the appropriate Supabase settings and any other environment values defined by the server configuration.

For optional outbound notifications, configure the following services:

- **Brevo:** API key, sender email address, and sender name.
- **Twilio:** Account SID, authentication token, and phone number.

Keep all credentials in local environment files or securely managed deployment environment variables. Never commit API keys, authentication tokens, or other secrets to version control.

## Available Scripts

The project provides scripts for development, production builds, code quality checks, and database seeding.

### Frontend Scripts

| Script | Purpose |
|---|---|
| Development | Starts the Vite development server. |
| Build | Generates the production frontend build in the distribution directory. |
| Preview | Previews the production build locally. |
| Lint | Runs ESLint to identify code quality issues. |

### Backend Scripts

| Script | Purpose |
|---|---|
| Development | Starts the API with Nodemon for automatic restarts during development. |
| Start | Starts the backend application. |
| Seed | Runs the backend seed script. |

Run each script from its respective application directory.

## API and Real-Time Communication

The backend exposes REST API endpoints under the `/api` prefix for authentication, queue management, branches, counters, users, notifications, and analytics.

Socket.IO provides real-time communication for queue events and public display updates.

During local development, the Vite development server proxies API requests and Socket.IO connections to the backend.

### Health Check Endpoints

- **Backend health:** `GET /health`
- **API health:** `GET /api/health`
- **Database health:** `GET /api/health/db`

These endpoints help verify backend availability and assess database connectivity or readiness.

## Deployment

SmartQueue supports separate frontend and backend deployment.

### Frontend Deployment
Build the React application and deploy the generated distribution directory to a suitable static hosting provider.

### Backend Deployment
Deploy the Express application to a Node.js-compatible hosting environment and configure the necessary production environment variables.

### Production Configuration
Before deployment:

- Configure the production Supabase connection.
- Set the correct frontend API URL.
- Configure the Socket.IO connection URL where required.
- Set the backend's allowed frontend origins through `CLIENT_URL` or `CLIENT_URLS`.
- Configure any required email or SMS provider credentials.
- Verify that frontend routing and API requests work correctly in production.

The project includes Vercel rewrite configuration. The Vite development proxy is intended for local development and should not be treated as a substitute for production backend configuration.

## Security and Access Control

SmartQueue uses role-based access control to provide different operational capabilities to customers, staff, branch administrators, and super administrators.

For production deployments, ensure that authentication, authorization, database access policies, environment variables, and API endpoints are configured securely. Sensitive credentials should never be exposed in frontend code or committed to the repository.

## Current Project Scope

SmartQueue is an MVP intended to demonstrate a practical, real-time queue management workflow for organizations operating physical service branches.

Its core functionality covers customer queue access, digital tickets, live queue tracking, staff workflows, branch administration, platform administration, and operational reporting.

A configured Supabase project and the required production credentials are necessary for deployment. Email and SMS delivery are optional integrations and are not required for the core queue management and in-app notification workflows.

## Future Enhancements

Potential areas for future development include:

- Advanced queue analytics and predictive waiting-time estimates.
- Enhanced customer feedback and satisfaction reporting.
- Additional notification channels.
- Improved accessibility and mobile user experience.
- Expanded reporting and performance dashboards.
- Integration with external customer management systems.

These are potential improvements rather than claims about currently implemented functionality.

## Conclusion

SmartQueue aims to improve customer service delivery by reducing queue uncertainty, improving operational visibility, and providing staff with tools to manage customer flow efficiently.

By combining real-time communication, digital ticketing, centralized administration, and role-based access control, the platform provides a foundation for more organized and transparent service delivery across multiple branches.

## License

Add the applicable license information before distributing or publishing the project. If no license has been selected, the project's licensing terms should be clarified before reuse or redistribution.