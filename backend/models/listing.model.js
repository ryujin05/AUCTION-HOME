import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    area: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    startingPrice: {
      type: Number,
      default: 0,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    bidIncrement: {
      type: Number,
      default: 100000,
    },
    reservePrice: {
      type: Number,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
      index: true,
    },
    auctionStatus: {
      type: String,
      enum: ["scheduled", "live", "ended"],
      default: "scheduled",
      index: true,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    auctionType: {
      type: String,
      enum: ["english", "reverse"],
      default: "english",
    },
    antiSnipingWindowSec: {
      type: Number,
      default: 120,
    },
    antiSnipingExtensionSec: {
      type: Number,
      default: 300,
    },
    bidCount: {
      type: Number,
      default: 0,
    },
    highestBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      required: true,
    },
    rental_type: {
      type: String,
      required: true,
    },
    images: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },

    //Tham chiếu đến người đăng
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true,
      index: true,
    },

    //Tham chiếu đến loại BĐS
    property_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PropertyType",
      // required: true
    },

    //Nhúng địa chỉ
    location: {
      province: {
        type: String,
        required: true,
      },
      ward: {
        type: String,
        required: true,
      },
      detail: String, //số nhà, tên đường
      // Có thể mở rộng thêm tọa độ

      coords: {
        type: {
          type: String,
          enum: ["Point"], // Bắt buộc phải là 'Point'
          default: "Point",
        },
        coordinates: {
          type: [Number], // Mảng số: [longitude, latitude] (Kinh độ trước, Vĩ độ sau)
          required: true,
        },
      },
    },

    bedroom: {
      type: Number,
      default: 0,
      index: true,
    },

    bathroom: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
    },

    //Mối quan hệ M-N với Utility, thêm thuộc tính amount
    amenities: [
      {
        utility: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Utility",
        },
        amount: {
          type: Number,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

listingSchema.index({ "location.coords": "2dsphere" });

const Listing = mongoose.model("Listing", listingSchema);

export default Listing;
