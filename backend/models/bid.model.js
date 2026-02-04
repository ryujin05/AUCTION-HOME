import mongoose from "mongoose";

const bidSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    maxAmount: {
      type: Number,
    },
    isProxy: {
      type: Boolean,
      default: false,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    depositStatus: {
      type: String,
      enum: ["held", "released", "refunded"],
      default: "held",
    },
  },
  {
    timestamps: true,
  }
);

bidSchema.index({ listing: 1, createdAt: -1 });

const Bid = mongoose.model("Bid", bidSchema);

export default Bid;
