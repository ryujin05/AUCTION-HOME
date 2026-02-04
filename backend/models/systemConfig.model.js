import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    commissionRate: {
      type: Number,
      default: 2,
    },
    defaultDepositAmount: {
      type: Number,
      default: 0,
    },
    antiSnipingWindowSec: {
      type: Number,
      default: 120,
    },
    antiSnipingExtensionSec: {
      type: Number,
      default: 300,
    },
  },
  { timestamps: true }
);

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);

export default SystemConfig;
