import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { workflowStatuses } from "../utils/taskUtils";

export function SettingsPage() {
  const { selectedProject, updateProject, deleteProject, user, setToast } = useApp();
  const role = selectedProject?.members?.find((member) => member.user._id === user?._id)?.role;
  const isAdmin = role === "Admin";
  const [steps, setSteps] = useState(workflowStatuses(selectedProject));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setSteps(workflowStatuses(selectedProject)));
  }, [selectedProject]);

  const updateStep = (index, value) => {
    setSteps((current) => current.map((step, itemIndex) => (itemIndex === index ? value : step)));
  };

  const removeStep = (index) => {
    setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const save = async () => {
    const workflow = [...new Set(steps.map((step) => step.trim()).filter(Boolean))];
    if (workflow.length < 2) {
      setToast("Workflow needs at least two steps");
      return;
    }

    await updateProject(selectedProject._id, { workflowStatuses: workflow }).catch((err) => setToast(err.message));
  };

  const submitDelete = async (event) => {
    event.preventDefault();
    setDeleting(true);
    try {
      await deleteProject(selectedProject._id, { password: deletePassword });
      setDeletePassword("");
      setDeleteOpen(false);
    } catch (err) {
      setToast(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="breadcrumb">Settings › {selectedProject?.name || "Project"}</p>
          <h1>Project Workflow</h1>
          <p>Control the ticket stages for this project.</p>
        </div>
      </div>

      <article className="panel settings-panel">
        {!isAdmin ? (
          <p className="empty-state">Only project admins can edit workflow steps.</p>
        ) : (
          <>
            <div className="workflow-editor">
              {steps.map((step, index) => (
                <div className="workflow-row" key={`workflow-step-${index}`}>
                  <span>{index + 1}</span>
                  <input value={step} onChange={(event) => updateStep(index, event.target.value)} />
                  <button className="icon-btn" title="Remove step" disabled={steps.length <= 2} onClick={() => removeStep(index)}><FiTrash2 /></button>
                </div>
              ))}
            </div>
            <div className="heading-actions">
              <button className="outline-btn flex justify-center items-center" onClick={() => setSteps((current) => [...current, `Step ${current.length + 1}`])}><FiPlus /> Add step</button>
              <button className="primary-btn small" onClick={save}>Save Workflow</button>
            </div>
          </>
        )}
      </article>

      {isAdmin && (
        <article className="panel settings-panel danger-zone">
          <div>
            <h2>Delete Project</h2>
            <p>This permanently removes the project, its workflow, members, invitations, and all tickets.</p>
          </div>
          <button className="danger-btn" type="button" onClick={() => setDeleteOpen(true)}>
            <FiTrash2 /> Delete Project
          </button>
        </article>
      )}

      {deleteOpen && (
        <div className="modal-backdrop">
          <form className="modal delete-project-modal" onSubmit={submitDelete}>
            <div className="panel-title">
              <h2>Confirm Project Delete</h2>
              <button type="button" title="Close" onClick={() => setDeleteOpen(false)}>x</button>
            </div>
            <p className="empty-state">Enter your password to delete "{selectedProject?.name}". This action cannot be undone.</p>
            <label>
              Password
              <input
                required
                autoFocus
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
              />
            </label>
            <button className="danger-btn full-width" type="submit" disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Project Permanently"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
