import { useEffect, useState } from "react";
import { FiClock, FiX } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { formatDate, PRIORITIES, PRIORITY_ORDER, workflowStatuses } from "../utils/taskUtils";

export function MyTasksPage() {
  const { tasks, selectedProject, selectedTask, setSelectedTask, saveTask, user, setToast } = useApp();
  const [sortBy, setSortBy] = useState("dueDate");
  const mine = tasks
    .filter((task) => task.assignedTo?._id === user?._id)
    .sort((a, b) => {
      if (sortBy === "priority") return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9);
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  const current = selectedTask || mine[0];
  const [draft, setDraft] = useState(current || null);
  const statuses = workflowStatuses(selectedProject);

  useEffect(() => {
    queueMicrotask(() => setDraft(current || null));
  }, [current]);

  return (
    <section className="split-tasks">
      <div className="my-task-list">
        <div className="section-heading">
          <div><h1>My Tasks</h1><p>Manage your active deliverables.</p></div>
          <select className="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="dueDate">Sort by due date</option>
            <option value="priority">Sort by priority</option>
          </select>
        </div>
        <div className="compact-columns">
          {statuses.map((status) => (
            <article key={status}>
              <h2><i className={`dot ${status.replaceAll(" ", "-").toLowerCase()}`} />{status}</h2>
              {mine.filter((task) => task.status === status).map((task) => (
                <button className={`mini-card ${current?._id === task._id ? "selected" : ""}`} key={task._id} onClick={() => setSelectedTask(task)}>
                  <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                  <strong>{task.title}</strong>
                  <small className="inline-icon"><FiClock /> {formatDate(task.dueDate)}</small>
                </button>
              ))}
            </article>
          ))}
        </div>
      </div>
      <aside className="task-detail">
        {!draft ? (
          <p className="empty-state">No assigned tasks yet.</p>
        ) : (
          <>
            <div className="detail-header"><button title="Close" onClick={() => setSelectedTask(null)}><FiX /></button><strong>Task Details</strong></div>
            <label>Current status
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>Task title
              <input disabled value={draft.title} readOnly />
            </label>
            <label>Priority
              <select disabled value={draft.priority}>
                {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
              </select>
            </label>
            <label>Due date
              <input disabled type="date" value={draft.dueDate?.slice(0, 10)} readOnly />
            </label>
            <label>Description
              <textarea disabled value={draft.description} readOnly />
            </label>
            <button className="primary-btn" onClick={() => saveTask({ _id: draft._id, status: draft.status }).catch((err) => setToast(err.message))}>Update Status</button>
            <p className="empty-state">Title, priority, due date, and description are managed by project admins.</p>
          </>
        )}
      </aside>
    </section>
  );
}
