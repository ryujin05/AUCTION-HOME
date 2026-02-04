import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    price: {
        type: Number,
        required: true
    },
    duration_months: {
        type: Number,
        required: true
    },
    benefits: [String]
}, {
    timestamps: true
})

const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;