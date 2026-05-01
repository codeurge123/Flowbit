import { FiActivity, FiAlertTriangle, FiCheckCircle, FiList } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { formatDate, workflowStatuses } from "../utils/taskUtils";

const metricIcons = {
  activity: FiActivity,
  alert: FiAlertTriangle,
  check: FiCheckCircle,
  list: FiList
};

function Metric({ title, value, hint, tone, icon }) {
  const Icon = metricIcons[icon];

  return (
    <article className="metric-card">
      <span className={`metric-icon ${tone}`}><Icon /></span>
      <h2>{title}</h2>
      <strong>{value}</strong>
      <p className={tone === "red" ? "danger" : ""}>{hint}</p>
    </article>
  );
}

export function DashboardPage() {
  const { dashboard, tasks, selectedProject, user } = useApp();
  const statusColumns = workflowStatuses(selectedProject);
  const status = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, Object.fromEntries(statusColumns.map((item) => [item, 0])));
  const total = tasks.length;
  const completed = status.Done || 0;
  const overdue = tasks.filter((task) => task.status !== "Done" && new Date(task.dueDate) < new Date());
  const perUser = Object.values(tasks.reduce((acc, task) => {
    const assignedUser = task.assignedTo || { name: "Unassigned", email: "" };
    const key = assignedUser._id || "unassigned";
    acc[key] ||= { user: assignedUser, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {}));
  const projectReports = dashboard?.projectReports || [];
  const selectedProjectReport = projectReports.find((report) => report.project._id === selectedProject?._id);
  const adminProjects = projectReports.filter((report) => report.role === "Admin");
  const role = selectedProject?.members?.find((member) => member.user._id === user?._id)?.role || "Member";

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <h1>{role === "Admin" ? "Admin Overview" : "My Overview"}</h1>
          <p>{role === "Admin" ? "Project health, member load, and ticket distribution." : "Your active projects, assignments, and delivery status."}</p>
        </div>
      </div>
      <div className="metric-grid">
        <Metric title="Projects Going" value={dashboard?.totalProjects || 0} hint={`${adminProjects.length} admin projects`} tone="blue" icon="activity" />
        <Metric title="Project Tasks" value={total} hint={`${selectedProject?.name || "Selected project"} tickets`} tone="blue" icon="list" />
        <Metric title="Completed" value={completed} hint={`${total ? Math.round((completed / total) * 100) : 0}% completion rate`} tone="green" icon="check" />
        <Metric title="Overdue" value={overdue.length} hint="Critical attention required" tone="red" icon="alert" />
      </div>
      <article className="panel project-report-panel">
        <div className="panel-title"><h2>{selectedProject?.name || "Project"} Status</h2><span>{total} tickets</span></div>
        <div className="project-report-list">
          <div className="project-report-row">
              <strong>{selectedProject?.name || "Selected project"}<small>{selectedProjectReport?.memberCount || selectedProject?.members?.length || 0} members · {total} tickets · {role}</small></strong>
              <div className="status-pills">
                {Object.entries(status).map(([label, count]) => (
                  <span key={label}>{label}: {count}</span>
                ))}
              </div>
          </div>
        </div>
      </article>
      <div className="dashboard-grid">
        <article className="panel status-panel">
          <div className="panel-title"><h2>Status Breakdown</h2><span>⋮</span></div>
          <div className="donut
          "><div className="donut-center"><strong>{total}</strong><span>Total</span></div></div>
          <div className="legend">
            {statusColumns.map((item) => <span key={item}><i className={`dot ${item.replaceAll(" ", "-").toLowerCase()}`} />{item} ({status[item] || 0})</span>)}
          </div>
        </article>
        <article className="panel people-panel">
          <div className="panel-title"><h2>Tasks per Team Member</h2><span>{selectedProject?.name || "Current project"}</span></div>
          <div className="people-bars">
            {perUser.map((row) => (
              <div className="person-bar" key={row.user._id || row.user.name}>
                <div style={{ height: `${Math.max(12, row.count * 32)}px` }} />
                <span className="avatar">{row.user.name?.slice(0, 2).toUpperCase()}</span>
                <small>{row.count}</small>
              </div>
            ))}
          </div>
        </article>
      </div>
      <article className="panel table-panel">
        <div className="panel-title"><h2>Critical Overdue Tasks</h2><span>{overdue.length} actions</span></div>
        <div className="task-table">
          {overdue.length === 0 && <p className="empty-state">No overdue tasks.</p>}
          {overdue.map((task) => (
            <div className="table-row" key={task._id}>
              <strong>{task.title}<small>Project: {task.project?.name}</small></strong>
              <span>{task.assignedTo?.name}</span>
              <span className="danger">{formatDate(task.dueDate)}</span>
              <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
