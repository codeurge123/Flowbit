import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";

const taskPopulate = (query) =>
  query
    .populate("assignedTo", "name email avatarColor")
    .populate("createdBy", "name email avatarColor")
    .populate("project", "name description members");

const getProjectMembership = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const membership = project.members.find((member) => member.user.equals(userId));
  if (!membership) throw new ApiError(403, "You are not a member of this project");

  return { project, membership };
};

const ensureWorkflowStatus = (project, status) => {
  const workflowStatuses = project.workflowStatuses?.length ? project.workflowStatuses : ["To Do", "In Progress", "Done"];
  if (!workflowStatuses.includes(status)) {
    throw new ApiError(400, "Status must be one of this project's workflow steps");
  }
};

const ensureTaskAccess = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, "Task not found");

  const { membership } = await getProjectMembership(task.project, userId);
  const isAssignee = task.assignedTo.equals(userId);
  const isAdmin = membership.role === "Admin";

  return { task, membership, isAdmin, isAssignee };
};

export const getTasks = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.projectId) {
    await getProjectMembership(req.query.projectId, req.user._id);
    filter.project = req.query.projectId;
  } else {
    const projects = await Project.find({ "members.user": req.user._id }).select("_id members");
    filter.project = { $in: projects.map((project) => project._id) };
  }

  if (req.query.status) filter.status = req.query.status;
  const tasks = await taskPopulate(Task.find(filter).sort({ dueDate: 1, createdAt: -1 }));

  return res.status(200).json(new ApiResponse(200, { tasks }, "Tasks fetched"));
});

export const createTask = asyncHandler(async (req, res) => {
  const { project, membership } = await getProjectMembership(req.body.projectId, req.user._id);
  if (membership.role !== "Admin") throw new ApiError(403, "Only admins can create tasks");

  const assigneeIsMember = project.members.some((member) => member.user.equals(req.body.assignedTo));
  if (!assigneeIsMember) throw new ApiError(400, "Assignee must be a project member");

  const status = req.body.status || project.workflowStatuses?.[0] || "To Do";
  ensureWorkflowStatus(project, status);

  const task = await Task.create({
    title: req.body.title,
    description: req.body.description || "",
    dueDate: req.body.dueDate,
    priority: req.body.priority,
    status,
    project: req.body.projectId,
    assignedTo: req.body.assignedTo,
    createdBy: req.user._id
  });

  const populatedTask = await taskPopulate(Task.findById(task._id));
  return res.status(201).json(new ApiResponse(201, { task: populatedTask }, "Task created"));
});

export const updateTask = asyncHandler(async (req, res) => {
  const { task, isAdmin, isAssignee } = await ensureTaskAccess(req.params.taskId, req.user._id);

  if (!isAdmin) {
    const fields = Object.keys(req.body);
    const canUpdateOwnStatusOnly = isAssignee && fields.length === 1 && fields[0] === "status";
    if (!canUpdateOwnStatusOnly) {
      throw new ApiError(403, "Members can update assigned ticket status only");
    }
  }

  if (req.body.status !== undefined) {
    const project = await Project.findById(task.project);
    ensureWorkflowStatus(project, req.body.status);
  }

  if (req.body.assignedTo && isAdmin) {
    const project = await Project.findById(task.project);
    const assigneeIsMember = project.members.some((member) => member.user.equals(req.body.assignedTo));
    if (!assigneeIsMember) throw new ApiError(400, "Assignee must be a project member");
    task.assignedTo = req.body.assignedTo;
  }

  ["title", "description", "dueDate", "priority", "status"].forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });

  await task.save();
  const populatedTask = await taskPopulate(Task.findById(task._id));
  return res.status(200).json(new ApiResponse(200, { task: populatedTask }, "Task updated"));
});

export const deleteTask = asyncHandler(async (req, res) => {
  const { task, isAdmin } = await ensureTaskAccess(req.params.taskId, req.user._id);
  if (!isAdmin) throw new ApiError(403, "Only admins can delete tasks");

  await task.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Task deleted"));
});
