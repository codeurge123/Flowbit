import { useEffect, useState } from "react";
import { FiClock, FiPlus, FiX } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { formatDate, initials, isOverdue, PRIORITIES, workflowStatuses } from "../utils/taskUtils";

export function ProjectsPage() {
  const { projects, selectedProject, setSelectedProjectId, tasks, setTaskModalOpen, selectedTask, setSelectedTask, saveTask, search, user, setToast } = useApp();
  const filteredTasks = tasks.filter((task) => task.title.toLowerCase().includes(search.toLowerCase()));
  const role = selectedProject?.members?.find((member) => member.user._id === user?._id)?.role;
  const isAdmin = role === "Admin";
  const statuses = workflowStatuses(selectedProject);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    queueMicrotask(() => setDraft(selectedTask || null));
  }, [selectedTask]);

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="breadcrumb">Projects › {selectedProject?.name || "Team Task Manager"}</p>
          <h1>{selectedProject?.name || "Development Kanban"}</h1>
        </div>
        <div className="heading-actions">
          <select value={selectedProject?._id || ""} onChange={(event) => setSelectedProjectId(event.target.value)}>
            {projects.map((project) => <option key={project._id} value={project._id}>{project.name}</option>)}
          </select>
          <button className="outline-btn">Share</button>
        </div>
      </div>
      <div className="project-workspace">
        <div className="kanban-board">
          {statuses.map((status) => {
            const columnTasks = filteredTasks.filter((task) => task.status === status);
            return (
              <article className="kanban-column" key={status}>
                <h2><i className={`dot ${status.replaceAll(" ", "-").toLowerCase()}`} />{status}<span>{columnTasks.length}</span></h2>
                {columnTasks.map((task) => (
                  <button
                    className={`task-card ${isOverdue(task) ? "overdue" : ""}`}
                    key={task._id}
                    onClick={() => isAdmin && setSelectedTask(task)}
                  >
                    <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
                    <strong>{task.title}</strong>
                    <p>{task.description}</p>
                    <footer><span className="inline-icon"><FiClock /> {formatDate(task.dueDate)}</span><span className="avatar mini">{initials(task.assignedTo?.name)}</span></footer>
                  </button>
                ))}
                {status === statuses[0] && isAdmin && <button className="add-task-tile" onClick={() => setTaskModalOpen(true)}><FiPlus /> Add Task</button>}
              </article>
            );
          })}
        </div>
      </div>
      {isAdmin && draft && (
        <div className="modal-backdrop">
          <form
            className="modal ticket-edit-modal"
            onSubmit={(event) => {
              event.preventDefault();
              saveTask(draft)
                .then(() => setSelectedTask(null))
                .catch((err) => setToast(err.message));
            }}
          >
            <div className="panel-title">
              <h2>Edit Ticket</h2>
              <button type="button" title="Close" onClick={() => setSelectedTask(null)}><FiX /></button>
            </div>
            <label>Status
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>Task title
              <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label>Assign to
              <select value={draft.assignedTo?._id || draft.assignedTo} onChange={(event) => setDraft({ ...draft, assignedTo: event.target.value })}>
                {selectedProject?.members?.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}</option>)}
              </select>
            </label>
            <div className="form-grid">
              <label>Priority
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
                  {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
                </select>
              </label>
              <label>Due date
                <input type="date" value={draft.dueDate?.slice(0, 10)} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} />
              </label>
            </div>
            <label>Description
              <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </label>
            <button className="primary-btn" type="submit">Save Ticket</button>
          </form>
        </div>
      )}
    </section>
  );
}
