# Flowbit - Team Task Manager

A full-stack task management and collaboration platform built to streamline team workflows, improve productivity, and provide a clean, scalable solution for managing projects and tasks in real time.

---

## Live Demo

- https://flowbits-two.vercel.app/

---

## Overview

This project is a modern task management system where users can create projects, assign tasks, track progress, and collaborate with team members.

The goal of this application is to bridge the gap between simplicity and functionality by providing an intuitive UI combined with a powerful backend.

---

## Features

### Authentication & Authorization

* Secure user signup and login
* Session-based or token-based authentication
* Role-based access control:

  * **Admin** → Full control over projects and tasks
  * **Member** → Limited access based on assignment

---

### Project Management

* Create and manage multiple projects
* Organize tasks within each project
* View all projects in a centralized dashboard

---

### Task Management

* Create, update, and delete tasks
* Assign tasks to team members
* Track task status:

  * Pending
  * In Progress
  * Completed

---

### Dashboard

* Overview of all tasks and projects
* Visual representation of task progress
* Quick access to active and overdue tasks

---

### User Experience

* Clean and modern UI
* Fully responsive design
* Smooth interactions and state updates

---

## Tech Stack

### Frontend

* **React.js** – Component-based UI
* **CSS / Tailwind CSS** – Styling and responsiveness
* **Axios / Fetch API** – API communication

### Backend

* **Node.js** – Runtime environment
* **Express.js** – REST API framework

### Database

* **MongoDB** – NoSQL database for flexible data modeling

---

## System Architecture

The application follows a **client-server architecture**:

* **Frontend (React)** handles UI and user interactions
* **Backend (Node + Express)** manages business logic and APIs
* **Database (MongoDB)** stores users, projects, and tasks

All communication between frontend and backend is handled via **RESTful APIs**.

---

## Application Flow

1. User signs up or logs in
2. Creates or joins a project
3. Adds tasks inside the project
4. Assigns tasks to team members
5. Updates task status as work progresses
6. Dashboard reflects real-time progress

---

## Folder Structure (Conceptual)

```
project-root/
│
├── client/              # React frontend
│   ├── components/
│   ├── pages/
│   ├── services/
│
├── server/              # Node + Express backend
│   ├── controllers/
│   ├── routes/
│   ├── models/
│
└── README.md
```

---

## Installation & Setup

### Clone the Repository

```
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### Install Dependencies

```
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### Environment Variables

Create a `.env` file in the server folder:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_secret_key
```

---

### Run the Application

```
# Run backend
cd server
npm run dev

# Run frontend
cd client
npm start
```

---

## Deployment

* **Frontend**: Deployed on Vercel
* **Backend**: Can be deployed on platforms like Render / Railway / AWS
* **Database**: MongoDB Atlas

---

## Key Highlights

* Scalable and modular architecture
* RESTful API design with proper validation
* Role-based access control implementation
* Clean and reusable React components
* Real-world team collaboration workflow

---

## Author

**codeurge - @yashbansal**
Full-Stack Developer (MERN)

---

## Contact

If you have any feedback or suggestions, feel free to reach out!
