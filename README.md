# Flowbit - Team Task Manager

Flowbit is a full-stack team task management app built with the stack already present in this repository: React + Vite on the frontend, Express + MongoDB/Mongoose on the backend, JWT authentication, and REST APIs.

## Features

- Signup, signin, logout, and persisted JWT sessions
- Project creation with creator as Admin
- Admin project member management
- Task creation, assignment, priority, due date, status updates, and deletion
- Member access limited to assigned tasks
- Dashboard metrics for total tasks, status breakdown, tasks per user, and overdue tasks
- Responsive Flowbit UI inspired by the provided references

## Tech Stack

- Frontend: React 19, Vite, CSS
- Backend: Node.js, Express 5, Mongoose, JWT, bcryptjs, Zod
- Database: MongoDB
- Deployment target: Railway

## Local Setup

```bash
npm install
```

Create `backend/.env`:

```bash
PORT=3000
MONGO_URI=mongodb+srv://USER:PASSWORD@HOST/flowbit
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

For local frontend API calls you can either use the built-in Vite proxy, or create `frontend/.env` if you want to call the backend directly:

```bash
# Optional. Without this, frontend dev uses Vite proxy at /api.
VITE_API_URL=http://localhost:3000/api
```

Run the backend and frontend in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Open `http://localhost:5173`.

## Production Build

```bash
npm run build
npm start
```

The backend serves `frontend/dist`, so one Railway service can host the full app after the frontend build runs.

## REST API

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/users`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:projectId`
- `PATCH /api/projects/:projectId`
- `POST /api/projects/:projectId/members`
- `DELETE /api/projects/:projectId/members/:userId`
- `GET /api/tasks?projectId=:projectId`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`
- `DELETE /api/tasks/:taskId`
- `GET /api/dashboard`

## Railway Deployment

1. Push this repository to GitHub.
2. Create a new Railway project from the GitHub repository.
3. Add a MongoDB database in Railway or use MongoDB Atlas.
4. Set these service variables:

```bash
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=https://your-railway-domain.up.railway.app
```

5. Use these commands if Railway does not auto-detect them:

```bash
Build Command: npm run build
Start Command: npm start
```

6. Generate the public Railway domain and use it as the live application URL.

## Submission Checklist

- Live application URL from Railway
- GitHub repository URL
- This README with setup and deployment steps
- 2-5 minute demo video covering signup, signin, project creation, member management, task creation/status updates, and dashboard metrics
