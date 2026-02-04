import mongoose from "mongoose";

const utilitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    icon: String,
    unit: {
        type: String,
        default: 'phòng'
    }
});

const Utility = mongoose.model("Utility", utilitySchema);

export default Utility;