import { useEffect, useState } from "react";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { workflowStatuses } from "../utils/taskUtils";

export function SettingsPage() {
  const { selectedProject, updateProject, user, setToast } = useApp();
  const role = selectedProject?.members?.find((member) => member.user._id === user?._id)?.role;
  const isAdmin = role === "Admin";
  const [steps, setSteps] = useState(workflowStatuses(selectedProject));

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
    </section>
  );
}
