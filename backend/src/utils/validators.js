import { z } from "zod";
import ApiError from "./ApiError.js";

export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message
    }));
    return next(new ApiError(400, "Validation failed", errors));
  }

  req[source] = result.data;
  next();
};

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
