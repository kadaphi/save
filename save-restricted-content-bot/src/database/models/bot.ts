import { Schema, model } from "mongoose"


const botSchema = new Schema({
    channels: {
        type: [Number],
        required: true,
        default: []
    },
    joinChannels: {
        type: [String],
        required: true,
        default: []
    },
    commission: {
        type: Number,
        required: true,
        default: 0
    },
    minWith: {
        type: Number,
        required: true,
        default: 0
    },
    limit: {
        daily: {
            type: Number,
            required: true,
            default: 0
        },
        monthly: {
            type: Number,
            required: true,
            default: 0
        }
    },
    price: {
        daily: {
            type: Number,
            required: true,
            default: 0
        },
        weekly: {
            type: Number,
            required: true,
            default: 0
        },
        monthly: {
            type: Number,
            required: true,
            default: 0
        },
        yearly: {
            type: Number,
            required: true,
            default: 0
        }
    }
})


export default model("bot", botSchema, "bot")