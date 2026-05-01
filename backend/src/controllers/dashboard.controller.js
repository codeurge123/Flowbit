import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const projects = await Project.find({ "members.user": req.user._id })
    .populate("members.user", "name email avatarColor")
    .select("_id name description members workflowStatuses");
  const visibleTaskFilter = { project: { $in: projects.map((project) => project._id) } };

  const tasks = await Task.find(visibleTaskFilter)
    .populate("assignedTo", "name email avatarColor")
    .populate("project", "name")
    .sort({ dueDate: 1 });

  const workflowStatuses = [...new Set(projects.flatMap((project) => project.workflowStatuses || []))];
  const byStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, Object.fromEntries(workflowStatuses.map((status) => [status, 0])));

  const perUserMap = new Map();
  tasks.forEach((task) => {
    const user = task.assignedTo;
    const key = user?._id?.toString() || "unassigned";
    const current = perUserMap.get(key) || {
      user: user || { name: "Unassigned", email: "" },
      count: 0
    };
    current.count += 1;
    perUserMap.set(key, current);
  });

  const now = new Date();
  const overdueTasks = tasks.filter((task) => task.status !== "Done" && task.dueDate < now);
  const projectReports = projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.project?._id?.equals(project._id));
    const statuses = project.workflowStatuses?.length ? project.workflowStatuses : ["To Do", "In Progress", "Done"];
    const tasksByStatus = projectTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, Object.fromEntries(statuses.map((status) => [status, 0])));
    const membership = project.members.find((member) => member.user._id.equals(req.user._id));

    return {
      project: {
        _id: project._id,
        name: project.name,
        description: project.description
      },
      role: membership?.role || "Member",
      memberCount: project.members.length,
      members: project.members,
      totalTasks: projectTasks.length,
      tasksByStatus,
      overdueCount: projectTasks.filter((task) => task.status !== "Done" && task.dueDate < now).length
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalTasks: tasks.length,
        tasksByStatus: byStatus,
        tasksPerUser: Array.from(perUserMap.values()),
        overdueTasks,
        totalProjects: projects.length,
        projectReports
      },
      "Dashboard fetched"
    )
  );
});
