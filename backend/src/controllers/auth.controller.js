import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  avatarColor: user.avatarColor,
  createdAt: user.createdAt
});

const sendAuthResponse = (res, user, message) => {
  const token = user.generateToken();
  return res
    .status(200)
    .cookie("accessToken", token, cookieOptions)
    .json(new ApiResponse(200, { user: publicUser(user), token }, message));
};

export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await User.create({ name, email, password });
  return sendAuthResponse(res, user, "Account created successfully");
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  return sendAuthResponse(res, user, "Logged in successfully");
});

export const logoutUser = asyncHandler(async (_req, res) => {
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!user || !(await user.isPasswordCorrect(currentPassword))) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, { user: publicUser(req.user) }, "Current user fetched"));
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().select("-password").sort({ name: 1 });
  return res.status(200).json(new ApiResponse(200, { users }, "Users fetched"));
});
