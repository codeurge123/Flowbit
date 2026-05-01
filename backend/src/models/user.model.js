import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    avatarColor: {
      type: String,
      default: "#0b4aad"
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = function isPasswordCorrect(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function generateToken() {
  return jwt.sign(
    { _id: this._id, email: this.email, name: this.name },
    process.env.JWT_SECRET || "flowbit-development-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export const User = mongoose.model("User", userSchema);
