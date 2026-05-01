import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const bearerToken = req.header("Authorization")?.replace("Bearer ", "");
  const token = req.cookies?.accessToken || bearerToken;

  if (!token) {
    throw new ApiError(401, "Authentication required");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || "flowbit-development-secret");
  const user = await User.findById(decoded._id).select("-password");

  if (!user) {
    throw new ApiError(401, "Invalid or expired token");
  }

  req.user = user;
  next();
});
