import mongoose from "mongoose"

const saveSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Listing"
    }
}, {
    timestamps: true
})

const Save = mongoose.model("Save", saveSchema);

export default Save;