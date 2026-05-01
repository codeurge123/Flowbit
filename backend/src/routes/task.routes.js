import { Router } from "express";
import { z } from "zod";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTask
} from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { objectIdSchema, validate } from "../utils/validators.js";

const router = Router();

const prioritySchema = z.enum(["Low", "Medium", "High", "Urgent"]);

const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1500).optional(),
  dueDate: z.coerce.date(),
  priority: prioritySchema.default("Medium"),
  status: z.string().trim().min(1).max(60).optional(),
  projectId: objectIdSchema,
  assignedTo: objectIdSchema
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(140).optional(),
    description: z.string().trim().max(1500).optional(),
    dueDate: z.coerce.date().optional(),
    priority: prioritySchema.optional(),
    status: z.string().trim().min(1).max(60).optional(),
    assignedTo: objectIdSchema.optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required"
  });

const taskParamsSchema = z.object({
  taskId: objectIdSchema
});

router.use(verifyJWT);
router.route("/").get(getTasks).post(validate(createTaskSchema), createTask);
router
  .route("/:taskId")
  .patch(validate(taskParamsSchema, "params"), validate(updateTaskSchema), updateTask)
  .delete(validate(taskParamsSchema, "params"), deleteTask);

export default router;
