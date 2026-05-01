export const STATUS_COLUMNS = ["To Do", "In Progress", "Done"];
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
export const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

export const emptyTaskForm = {
  title: "",
  description: "",
  dueDate: "",
  priority: "Medium",
  status: "To Do",
  assignedTo: ""
};

export const initials = (name = "U") =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const formatDate = (date) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(date));

export const isOverdue = (task) => task.status !== "Done" && new Date(task.dueDate) < new Date();

export const workflowStatuses = (project) =>
  project?.workflowStatuses?.length ? project.workflowStatuses : STATUS_COLUMNS;
