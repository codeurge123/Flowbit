import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["Admin", "Member"],
      default: "Member"
    }
  },
  { _id: false }
);

const projectInvitationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["Admin", "Member"],
      default: "Member"
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Declined"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: {
      type: [projectMemberSchema],
      default: []
    },
    workflowStatuses: {
      type: [String],
      default: ["To Do", "In Progress", "Done"],
      validate: {
        validator(statuses) {
          return Array.isArray(statuses) && statuses.length >= 2 && new Set(statuses).size === statuses.length;
        },
        message: "Workflow must contain at least two unique steps"
      }
    },
    invitations: {
      type: [projectInvitationSchema],
      default: []
    }
  },
  { timestamps: true }
);

projectSchema.index({ "members.user": 1 });
projectSchema.index({ "invitations.user": 1, "invitations.status": 1 });

export const Project = mongoose.model("Project", projectSchema);
