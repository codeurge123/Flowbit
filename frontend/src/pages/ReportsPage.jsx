import { FiAlertTriangle, FiBarChart2, FiCheckCircle, FiClock, FiTrendingUp } from "react-icons/fi";
import { useApp } from "../context/useApp";
import { formatDate, workflowStatuses } from "../utils/taskUtils";

function ReportStat({ icon: Icon, label, value, hint, tone = "blue" }) {
  return (
    <article className="metric-card">
      <span className={`metric-icon ${tone}`}><Icon /></span>
      <h2>{label}</h2>
      <strong>{value}</strong>
      <p>{hint}</p>
    </article>
  );
}

export function ReportsPage() {
  const { tasks, selectedProject, user } = useApp();
  const role = selectedProject?.members?.find((member) => member.user._id === user?._id)?.role || "Member";
  const isAdmin = role === "Admin";
  const projectMemberIds = new Set(selectedProject?.members?.map((member) => member.user._id) || []);
  const projectTasks = tasks.filter((task) => !task.assignedTo?._id || projectMemberIds.has(task.assignedTo._id));
  const reportTasks = isAdmin ? projectTasks : projectTasks.filter((task) => task.assignedTo?._id === user?._id);
  const statuses = workflowStatuses(selectedProject);
  const status = reportTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, Object.fromEntries(statuses.map((item) => [item, 0])));
  const total = reportTasks.length;
  const completed = status.Done || 0;
  const inProgress = status["In Progress"] || 0;
  const overdue = reportTasks.filter((task) => task.status !== "Done" && new Date(task.dueDate) < new Date());
  const perUser = isAdmin
    ? (selectedProject?.members || []).map((member) => ({
        user: member.user,
        count: reportTasks.filter((task) => task.assignedTo?._id === member.user._id).length
      }))
    : [{ user, count: reportTasks.length }];
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const urgentTasks = reportTasks.filter((task) => task.priority === "Urgent");

  return (
    <section className="content-section reports-section">
      <div className="section-heading">
        <div>
          <p className="breadcrumb">Reports › {selectedProject?.name || "Workspace"}</p>
          <h1>{isAdmin ? "Project Reports" : "My Performance"}</h1>
          <p>{isAdmin ? "Track delivery health, team workload, and priority risk for the current workspace." : "Review your assigned tickets, overdue work, and completion progress."}</p>
        </div>
      </div>

      <div className="metric-grid">
        <ReportStat icon={FiBarChart2} label="Total Tickets" value={total} hint={isAdmin ? `${projectTasks.length} visible in board` : "Assigned to you"} />
        <ReportStat icon={FiCheckCircle} label="Completion" value={`${completionRate}%`} hint={`${completed} completed tickets`} tone="green" />
        <ReportStat icon={FiClock} label="In Progress" value={inProgress} hint="Currently active tickets" />
        <ReportStat icon={FiAlertTriangle} label="Overdue" value={overdue.length} hint="Needs admin attention" tone="red" />
      </div>

      <div className="reports-grid">
        <article className="panel">
          <div className="panel-title"><h2>Status Distribution</h2><span>{total} tickets</span></div>
          <div className="report-bars">
            {statuses.map((item) => {
              const count = status[item] || 0;
              const width = total ? Math.max(8, Math.round((count / total) * 100)) : 0;
              return (
                <div className="report-bar-row" key={item}>
                  <span><i className={`dot ${item.replaceAll(" ", "-").toLowerCase()}`} />{item}</span>
                  <div><b style={{ width: `${width}%` }} /></div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-title"><h2>{isAdmin ? "Team Workload" : "My Workload"}</h2><span>Assigned tickets</span></div>
          <div className="workload-list">
            {perUser.length === 0 && <p className="empty-state">No assigned work yet.</p>}
            {perUser.map((row) => (
              <div className="workload-row" key={row.user._id || row.user.name}>
                <span className="avatar">{row.user.name?.slice(0, 2).toUpperCase()}</span>
                <strong>{row.user.name}<small>{row.user.email}</small></strong>
                <span>{row.count}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="panel table-panel">
        <div className="panel-title"><h2>Risk Register</h2><span><FiTrendingUp /> Priority watch</span></div>
        <div className="task-table">
          {[...overdue, ...urgentTasks.filter((task) => !overdue.some((item) => item._id === task._id))].slice(0, 8).map((task) => (
            <div className="table-row" key={task._id}>
              <strong>{task.title}<small>{task.project?.name || selectedProject?.name}</small></strong>
              <span>{task.assignedTo?.name}</span>
              <span className={new Date(task.dueDate) < new Date() && task.status !== "Done" ? "danger" : ""}>{formatDate(task.dueDate)}</span>
              <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
