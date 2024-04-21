import { Schema, model } from "mongoose"


const userSchema = new Schema({
    telegramId: {
        type: Number,
        unique: true,
        required: true
    },
    referrer: {
        type: Number,
        required: true,
        default: 0
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    expiry: {
        type: Number,
        required: true,
        default: 0
    },
    refCount: {
        type: Number,
        required: true,
        default: 0
    },
    usage: {
        daily: {
            type: Number,
            required: true,
            default: 0
        },
        monthly: {
            type: Number,
            required: true,
            default: 0
        },
        dailyJoins: {
            type: Number,
            required: true,
            default: 0
        }
    }
})


export default model("users", userSchema, "users")