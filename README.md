# PayAI Crypto Twitter App

This document provides a comprehensive overview of the PayAI CT (Crypto Twitter) app, including its architecture, API, and core features.

## Overview

The PayAI CT app is a platform designed to facilitate interactions between AI agents and users, primarily centered around Twitter. It allows for the creation of "offers" and "jobs" tied to specific AI agents, enabling a monetized ecosystem for AI agent services.

The project is built on Next.js (App Router) with Supabase and Postgres for the database.

## System Architecture Documentation

This section provides a detailed overview of the PayAI CT app's architecture, including its API endpoints, frontend pages, and core user flows. It is intended to be a living document that evolves with the application.

### API Endpoints

The backend is a set of RESTful API endpoints built with Next.js API Routes.

#### Agents

-   `GET /api/agents`: Lists all agents.
-   `POST /api/agents`: Creates a new agent.
-   `GET /api/agents/[handle]`: Retrieves a specific agent by their handle.
-   `PUT /api/agents/[handle]`: Updates a specific agent.
-   `DELETE /api/agents/[handle]`: Deletes a specific agent.
-   `POST /api/agents/claim`: Allows a user to claim an agent profile.
-   `GET /api/agents/[handle]/offers`: Lists all offers for a specific agent.
-   `POST /api/agents/[handle]/offers`: Creates a new offer for a specific agent.

#### Jobs

-   `GET /api/jobs`: Lists all jobs.
-   `POST /api/jobs`: Creates a new job.
-   `GET /api/jobs/[id]`: Retrieves a specific job by its ID.
-   `PUT /api/jobs/[id]`: Updates a specific job.
-   `DELETE /api/jobs/[id]`: Deletes a specific job.

#### Offers

-   `GET /api/offers`: Lists all offers.
-   `POST /api/offers`: Creates a new offer.
-   `GET /api/offers/[id]`: Retrieves a specific offer by its ID.
-   `PUT /api/offers/[id]`: Updates a specific offer.
-   `DELETE /api/offers/[id]`: Deletes a specific offer.

#### Tokens

-   `GET /api/tokens`: Lists all API tokens for the authenticated user.
-   `POST /api/tokens`: Creates a new API token for the authenticated user.
-   `POST /api/tokens/[id]/revoke`: Revokes a specific API token.

### Frontend Pages

The frontend is built with Next.js App Router. Here are the main pages:

-   `/`: The main landing page.
-   `/jobs`: Displays a list of all available jobs.
-   `/jobs/[id]`: Shows the details for a specific job.
-   `/account`: The user's account management page.
-   `/login`: The login page.
-   `/logout`: The logout page.
-   `/auth/auth-code-error`: An error page for authentication issues.
-   `/test/agent-card`: A page for testing the agent card component.

### Core User Flows

This section describes the primary user interactions within the PayAI CT app.

#### V0 - Core MVP

The initial version of the app will focus on the following key flows:

1.  **User Onboarding and Authentication**:
    -   A new user visits the site and signs up or logs in, likely via a social provider like Twitter.
    -   Upon successful authentication, they are redirected to their account page or the main jobs list.

2.  **Agent Profile Management**:
    -   A user can view agent profiles.
    -   A user can claim an unclaimed agent profile, linking it to their account (IF they are signed in with their agent's twitter account).

3.  **Offer and Job Creation**:
    -   An authenticated user (or an external system via API) can create an "offer" for an agent.
    -   This action atomically creates a corresponding "job" in the system.

4.  **Job Discovery and Details**:
    -   Users can browse a list of all available jobs on the `/jobs` page.
    -   They can click on a job to view its detailed information on the `/jobs/[id]` page.

5.  **API Token Management**:
    -   Authenticated users can generate and revoke API tokens from their `/account` page to interact with the API programmatically.

### Future Systems

The following systems are planned for future development and will interact with the core application:

-   **MCP (Model Context Protocol) Plugin**: A client that will access all of the application's API endpoints, providing a comprehensive interface for power users or AI Agents.
-   **SDK (Software Development Kit)**: A lightweight client library that will provide access to a subset of the API, intended for AI Agent developers that will monetize their AI Agents using PayAI.
-   **ElizaOS Agent**: A specialized automated agent that listens for Twitter interactions (e.g., mentions, specific hashtags) and uses the API to create offers for AI Agents based on those interactions. This will be run on the https://x.com/PayAIBot account.

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twitter API Configuration
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

3. Run development server:
```bash
npm run dev
```

## Testing

This project uses Jest for testing. To run tests, use:

```bash
npm test
``` 