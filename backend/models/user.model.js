import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["login", "login-google"],
      default: "login",
    },

    //profile
    profile: {
      fullName: String,
      gender: {
        type: String,
        enum: ["male", "female", "other"],
      },
      birthday: Date,
      address: String,
      bio: String,
    },

    //Thông tin về gói đăng ký
    subscriptionPlan: {
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
      },
      startDate: Date,
      endDate: Date,
      status: {
        type: String,
        enum: ["active", "inactive", "canceled"],
        default: "inactive",
      },
    },

    //Mối quan hệ N-N với savedListings
    savedListings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
      },
    ],
    // Admin: flag to ban/block a user
    isBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: String,
    emailVerificationExpire: Date,
    resetPasswordCode: String,
    resetPasswordCodeExpire: Date,
    avatar: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

userSchema.methods.generateEmailVerificationCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.emailVerificationCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  this.emailVerificationExpire = Date.now() + 4 * 60 * 1000; // 2 minutes
  return code;
};

userSchema.methods.generateResetPasswordCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.resetPasswordCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");
  this.resetPasswordCodeExpire = Date.now() + 4 * 60 * 1000; // 3 minutes
  return code;
};

userSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 600, //   10 phút * 60 giây = 600 giây
    partialFilterExpression: { emailVerified: false },
  }
);

const User = mongoose.model("User", userSchema);

export default User;
