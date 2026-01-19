# Netball Coach Planner

A mobile application for netball coaches to plan seasons, build weekly programs, create drills, and track statistics.

## Tech Stack

- **Frontend**: React Native with Expo
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Navigation**: Expo Router
- **Backend**: Node.js with Express
- **API**: tRPC
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Manus OAuth

## Prerequisites

- Node.js (v18 or later recommended)
- pnpm (Package Manager)

## Setup

1.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

2.  **Environment Configuration**:
    - The project uses `dotenv` for environment variables.
    - Check `server/README.md` for detailed backend configuration (Database, Auth, etc.).
    - For local UI development, you might be able to run without a full backend setup, but some features may be limited.

## Running the Project

To run both the backend server and the Expo development server concurrently:

```bash
pnpm dev
```

### Running Components Separately

- **Frontend only** (Web):
    ```bash
    pnpm dev:metro
    ```
    This will start the Expo development server. Press `w` to open in the web browser, or scan the QR code with your phone (requires Expo Go app).

- **Backend only**:
    ```bash
    pnpm dev:server
    ```
    This starts the Express server with tRPC API.

## Project Structure

- `app/`: Frontend application code (Expo Router pages).
- `components/`: Reusable UI components.
- `server/`: Backend server code.
- `drizzle/`: Database schema and migrations.
- `design.md`: Detailed design document for the application.

## Documentation

- See `server/README.md` for detailed backend documentation.
- See `design.md` for the application design specifications.
