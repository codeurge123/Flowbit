import { useState } from "react";
import { FiClock } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { initials } from "../utils/taskUtils";

export function TeamPage() {
  const { selectedProject, user, addMember, removeMember, setToast } = useApp();
  const [form, setForm] = useState({ email: "", role: "Member" });
  const role = selectedProject?.members?.find((member) => member.user._id === user?._id)?.role;

  return (
    <section className="content-section">
      <div className="section-heading"><div><h1>Team</h1><p>Manage members for {selectedProject?.name || "your project"}.</p></div></div>
      <article className="panel team-panel">
        {role === "Admin" && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              addMember(form)
                .then(() => setForm({ email: "", role: "Member" }))
                .catch((err) => setToast(err.message));
            }}
            className="member-form"
          >
            <input type="email" required placeholder="member@company.com" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option>Member</option><option>Admin</option></select>
            <button className="primary-btn small">Send invite</button>
          </form>
        )}
        <div className="member-list">
          {selectedProject?.members?.map((member) => (
            <div key={member.user._id} className="member-row">
              <span className="avatar">{initials(member.user.name)}</span>
              <strong>{member.user.name}<small>{member.user.email}</small></strong>
              <span>{member.role}</span>
              {role === "Admin" && member.user._id !== selectedProject.createdBy?._id && (
                <button className="outline-btn" onClick={() => removeMember(member.user._id).catch((err) => setToast(err.message))}>Remove</button>
              )}
            </div>
          ))}
        </div>
        {role === "Admin" && selectedProject?.invitations?.some((invitation) => invitation.status === "Pending") && (
          <>
            <div className="panel-title team-subtitle"><h2>Pending Invitations</h2><span>Waiting for acceptance</span></div>
            <div className="member-list">
              {selectedProject.invitations
                .filter((invitation) => invitation.status === "Pending")
                .map((invitation) => (
                  <div key={invitation._id} className="member-row">
                    <span className="avatar">{initials(invitation.user.name)}</span>
                    <strong>{invitation.user.name}<small>{invitation.user.email}</small></strong>
                    <span>{invitation.role}</span>
                    <span className="inline-icon pending-label"><FiClock /> Pending</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </article>
    </section>
  );
}
