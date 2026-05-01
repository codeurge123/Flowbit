import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { User } from "../models/user.model.js";
import { addRealtimeClient, sendRealtimeEvent } from "../utils/realtime.js";

const populateProject = (query) =>
  query
    .populate("createdBy", "name email avatarColor")
    .populate("members.user", "name email avatarColor")
    .populate("invitations.user", "name email avatarColor")
    .populate("invitations.invitedBy", "name email avatarColor");

const pendingInvitation = (project, userId) =>
  project.invitations.find(
    (invitation) => invitation.user.equals(userId) && invitation.status === "Pending"
  );

export const getUserProjects = asyncHandler(async (req, res) => {
  const projects = await populateProject(
    Project.find({ "members.user": req.user._id }).sort({ updatedAt: -1 })
  );

  return res.status(200).json(new ApiResponse(200, { projects }, "Projects fetched"));
});

export const createProject = asyncHandler(async (req, res) => {
  const workflowStatuses = req.body.workflowStatuses?.length ? [...new Set(req.body.workflowStatuses)] : undefined;
  const project = await Project.create({
    name: req.body.name,
    description: req.body.description || "",
    createdBy: req.user._id,
    members: [{ user: req.user._id, role: "Admin" }],
    ...(workflowStatuses ? { workflowStatuses } : {})
  });

  const populatedProject = await populateProject(Project.findById(project._id));
  return res.status(201).json(new ApiResponse(201, { project: populatedProject }, "Project created"));
});

export const getProjectById = asyncHandler(async (req, res) => {
  const project = await populateProject(Project.findById(req.params.projectId));
  if (!project) throw new ApiError(404, "Project not found");

  const isMember = project.members.some((member) => member.user._id.equals(req.user._id));
  if (!isMember) throw new ApiError(403, "You are not a member of this project");

  return res.status(200).json(new ApiResponse(200, { project }, "Project fetched"));
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const requester = project.members.find((member) => member.user.equals(req.user._id));
  if (!requester || requester.role !== "Admin") {
    throw new ApiError(403, "Only project admins can update project details");
  }

  project.name = req.body.name ?? project.name;
  project.description = req.body.description ?? project.description;

  if (req.body.workflowStatuses) {
    const workflowStatuses = [...new Set(req.body.workflowStatuses.map((status) => status.trim()).filter(Boolean))];
    if (workflowStatuses.length < 2) {
      throw new ApiError(400, "Workflow must contain at least two unique steps");
    }

    const usedStatuses = await Task.distinct("status", { project: project._id });
    const removedUsedStatus = usedStatuses.find((status) => !workflowStatuses.includes(status));
    if (removedUsedStatus) {
      throw new ApiError(400, `Cannot remove workflow step with existing tickets: ${removedUsedStatus}`);
    }

    project.workflowStatuses = workflowStatuses;
  }

  await project.save();

  const populatedProject = await populateProject(Project.findById(project._id));
  return res.status(200).json(new ApiResponse(200, { project: populatedProject }, "Project updated"));
});

export const addProjectMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const requester = project.members.find((member) => member.user.equals(req.user._id));
  if (!requester || requester.role !== "Admin") {
    throw new ApiError(403, "Only admins can manage project members");
  }

  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new ApiError(404, "No user found with that email");

  const exists = project.members.some((member) => member.user.equals(user._id));
  if (exists) throw new ApiError(409, "User is already a member");

  const existingInvitation = pendingInvitation(project, user._id);
  if (existingInvitation) throw new ApiError(409, "User already has a pending invitation");

  project.invitations.push({
    user: user._id,
    invitedBy: req.user._id,
    role: req.body.role || "Member"
  });
  await project.save();

  const populatedProject = await populateProject(Project.findById(project._id));
  sendRealtimeEvent(user._id, "invitation", {
    projectId: project._id,
    projectName: project.name,
    invitedBy: req.user.name,
    role: req.body.role || "Member"
  });
  return res.status(200).json(new ApiResponse(200, { project: populatedProject }, "Invitation sent"));
});

export const getProjectInvitations = asyncHandler(async (req, res) => {
  const projects = await populateProject(
    Project.find({
      invitations: {
        $elemMatch: {
          user: req.user._id,
          status: "Pending"
        }
      }
    }).sort({ updatedAt: -1 })
  );

  const invitations = projects.flatMap((project) =>
    project.invitations
      .filter((invitation) => invitation.user._id.equals(req.user._id) && invitation.status === "Pending")
      .map((invitation) => ({
        _id: invitation._id,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        invitedBy: invitation.invitedBy,
        project: {
          _id: project._id,
          name: project.name,
          description: project.description
        }
      }))
  );

  return res.status(200).json(new ApiResponse(200, { invitations }, "Invitations fetched"));
});

export const streamProjectInvitations = asyncHandler(async (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive"
  });
  res.flushHeaders?.();

  const removeClient = addRealtimeClient(req.user._id, res);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeClient();
  });
});

export const respondToProjectInvitation = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const invitation = pendingInvitation(project, req.user._id);
  if (!invitation) throw new ApiError(404, "Pending invitation not found");

  if (req.body.action === "accept") {
    const exists = project.members.some((member) => member.user.equals(req.user._id));
    if (!exists) {
      project.members.push({ user: req.user._id, role: invitation.role });
    }
    invitation.status = "Accepted";
  } else {
    invitation.status = "Declined";
  }

  await project.save();

  const populatedProject = await populateProject(Project.findById(project._id));
  return res.status(200).json(
    new ApiResponse(
      200,
      { project: populatedProject },
      req.body.action === "accept" ? "Invitation accepted" : "Invitation declined"
    )
  );
});

export const removeProjectMember = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const requester = project.members.find((member) => member.user.equals(req.user._id));
  if (!requester || requester.role !== "Admin") {
    throw new ApiError(403, "Only admins can manage project members");
  }

  const memberId = new mongoose.Types.ObjectId(req.params.userId);
  if (project.createdBy.equals(memberId)) {
    throw new ApiError(400, "Project creator cannot be removed");
  }

  project.members = project.members.filter((member) => !member.user.equals(memberId));
  project.invitations = project.invitations.filter((invitation) => !invitation.user.equals(memberId));
  await project.save();
  await Task.deleteMany({ project: project._id, assignedTo: memberId });

  const populatedProject = await populateProject(Project.findById(project._id));
  return res.status(200).json(new ApiResponse(200, { project: populatedProject }, "Member removed"));
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const requester = project.members.find((member) => member.user.equals(req.user._id));
  if (!requester || requester.role !== "Admin") {
    throw new ApiError(403, "Only project admins can delete this project");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user || !(await user.isPasswordCorrect(req.body.password))) {
    throw new ApiError(401, "Password is incorrect");
  }

  await Task.deleteMany({ project: project._id });
  await project.deleteOne();

  return res.status(200).json(new ApiResponse(200, {}, "Project deleted"));
});
