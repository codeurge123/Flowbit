import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { emptyTaskForm, PRIORITIES, workflowStatuses } from "../utils/taskUtils";

export function TaskModal() {
  const { taskModalOpen, setTaskModalOpen, projects, selectedProject, createTask, setToast } = useApp();
  const [form, setForm] = useState(emptyTaskForm);
  const project = projects.find((item) => item._id === (form.projectId || selectedProject?._id));
  const statuses = workflowStatuses(project);

  useEffect(() => {
    if (!taskModalOpen) return;
    queueMicrotask(() => {
      setForm({
        ...emptyTaskForm,
        status: workflowStatuses(selectedProject)[0],
        projectId: selectedProject?._id || "",
        assignedTo: selectedProject?.members?.[0]?.user?._id || ""
      });
    });
  }, [taskModalOpen, selectedProject]);

  if (!taskModalOpen) return null;

  return (
    <div className="modal-backdrop">
      <form
        className="modal"
        onSubmit={(event) => {
          event.preventDefault();
          createTask(form).catch((err) => setToast(err.message));
        }}
      >
        <div className="panel-title">
          <h2>Create Task</h2>
          <button type="button" title="Close" onClick={() => setTaskModalOpen(false)}><FiX /></button>
        </div>
        <label>Project
          <select value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value, assignedTo: "" })}>
            {projects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        <label>Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <div className="form-grid">
          <label>Due date<input required type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
          <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>{PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}</select></label>
        </div>
        <label>Status
          <select value={form.status || statuses[0]} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label>Assign to
          <select required value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })}>
            <option value="">Select member</option>
            {project?.members?.map((member) => <option key={member.user._id} value={member.user._id}>{member.user.name}</option>)}
          </select>
        </label>
        <button className="primary-btn">Create Task</button>
      </form>
    </div>
  );
}

export function ProjectModal() {
  const { projectModalOpen, setProjectModalOpen, createProject, setToast } = useApp();
  const [form, setForm] = useState({ name: "", description: "" });

  if (!projectModalOpen) return null;

  return (
    <div className="modal-backdrop">
      <form
        className="modal"
        onSubmit={(event) => {
          event.preventDefault();
          createProject(form)
            .then(() => setForm({ name: "", description: "" }))
            .catch((err) => setToast(err.message));
        }}
      >
        <div className="panel-title">
          <h2>New Project</h2>
          <button type="button" title="Close" onClick={() => setProjectModalOpen(false)}><FiX /></button>
        </div>
        <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <button className="primary-btn">Create Project</button>
      </form>
    </div>
  );
}

export function ChangePasswordModal() {
  const { passwordModalOpen, setPasswordModalOpen, changePassword, setToast } = useApp();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  if (!passwordModalOpen) return null;

  const close = () => {
    setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordModalOpen(false);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setToast("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="panel-title">
          <h2>Change Password</h2>
          <button type="button" title="Close" onClick={close}><FiX /></button>
        </div>
        <label>
          Current password
          <input
            required
            type="password"
            value={form.currentPassword}
            onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
          />
        </label>
        <label>
          New password
          <input
            required
            minLength="6"
            type="password"
            value={form.newPassword}
            onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
          />
        </label>
        <label>
          Confirm new password
          <input
            required
            minLength="6"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          />
        </label>
        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
