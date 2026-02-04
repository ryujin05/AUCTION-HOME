import mongoose from "mongoose";

const appoinmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },

    dateTime: {
        type: Date,
        required: true
    },
    note: String,
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'canceled', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Appointment = mongoose.model("Appointment", appoinmentSchema);

export default Appointment;