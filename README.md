# Task app

Angular client, Express API, and Postgres. Each user signs up, logs in, and manages only their own tasks.

## Setup

1. Copy the server environment file:

   ```bash
   copy server\.env.example server\.env
   ```

   `server/.env` is already filled in for local Docker. Change `JWT_SECRET` before any shared deployment.

2. Start Postgres. The database is published on host port 5433 so it can run beside anything already using port 5432.

   ```bash
   docker compose up -d
   ```

3. Install dependencies, generate the Prisma client, and migrate:

   ```bash
   cd server
   npm install
   npx prisma migrate dev --name init
   ```

4. Start the API:

   ```bash
   npm run dev
   ```

   The API listens on `http://localhost:3000`.

5. In another terminal, start the Angular app:

   ```bash
   cd client
   npm install
   npx ng serve
   ```

   Open `http://localhost:4200`.

The first user is created on the register screen. No seed data is loaded.
