import mongoose from "mongoose";

const adminActionSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    target: { type: mongoose.Schema.Types.Mixed },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const AdminAction = mongoose.model("AdminAction", adminActionSchema);

export default AdminAction;
