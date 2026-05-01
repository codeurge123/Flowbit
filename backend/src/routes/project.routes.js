import { Router } from "express";
import { z } from "zod";
import {
  addProjectMember,
  createProject,
  getProjectInvitations,
  getProjectById,
  getUserProjects,
  removeProjectMember,
  respondToProjectInvitation,
  updateProject
} from "../controllers/project.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { objectIdSchema, validate } from "../utils/validators.js";

const router = Router();

const projectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  workflowStatuses: z.array(z.string().trim().min(1).max(60)).min(2).optional()
});

const updateProjectSchema = projectSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required"
});

const memberSchema = z.object({
  email: z.email().toLowerCase(),
  role: z.enum(["Admin", "Member"]).default("Member")
});

const projectParamsSchema = z.object({
  projectId: objectIdSchema
});

const removeMemberParamsSchema = z.object({
  projectId: objectIdSchema,
  userId: objectIdSchema
});

const invitationActionSchema = z.object({
  action: z.enum(["accept", "decline"])
});

router.use(verifyJWT);
router.route("/").get(getUserProjects).post(validate(projectSchema), createProject);
router.get("/invitations", getProjectInvitations);
router
  .route("/:projectId")
  .get(validate(projectParamsSchema, "params"), getProjectById)
  .patch(validate(projectParamsSchema, "params"), validate(updateProjectSchema), updateProject);
router.patch(
  "/:projectId/invitations",
  validate(projectParamsSchema, "params"),
  validate(invitationActionSchema),
  respondToProjectInvitation
);
router.post(
  "/:projectId/members",
  validate(projectParamsSchema, "params"),
  validate(memberSchema),
  addProjectMember
);
router.delete(
  "/:projectId/members/:userId",
  validate(removeMemberParamsSchema, "params"),
  removeProjectMember
);

export default router;
