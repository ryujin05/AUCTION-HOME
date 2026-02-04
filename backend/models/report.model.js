import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
    //Người báo cáo
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    //Bài đăng bị báo cáo
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    reason: {
        type: String,
        required: true
    },

    detail: {
        type: String,
    },

    status: {
        type: String,
        enum: ['pending', 'reviewed', 'resolved'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Report = mongoose.model("Report", reportSchema);

export default Report;