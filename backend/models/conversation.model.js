import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    title: String,
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    type: {
        type: String,
        enum: ['private', 'group'],
        default: 'private'
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }
}, {
    timestamps: true
});

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;