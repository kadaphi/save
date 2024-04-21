import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import { accountHandler } from "./account"
import axios from "axios"

const bot = new Composer<MyContext>()

bot.use(createConversation(deposit))

async function deposit(conversation: MyConversation, ctx: MyContext) {
    await ctx.editMessageText("Enter amount to deposit in USD:", {
        reply_markup: new InlineKeyboard()
            .text("Cancel", "cancel")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && !isNaN(parseFloat(ctx.msg.text)) && !ctx.msg.text.includes("+") && !ctx.msg.text.includes("-") && parseFloat(ctx.msg.text) >= 0.1) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("Invalid Amount", {
            reply_markup: new InlineKeyboard()
                .text("Back", "account"),
            reply_parameters: { message_id: ctx.msgId! }
        })
    })

    if (ctx.callbackQuery?.data === "cancel") return await accountHandler(ctx)

    axios.post("https://api.oxapay.com/merchants/request", {
        merchant: process.env.OXAPAY_MERCHANT_KEY,
        amount: ctx.msg?.text,
        lifeTime: 1440,
        callbackUrl: `https://${process.env.DOMAIN}/callback/deposit/${ctx.from?.id}`
    })
        .then(async (response: any) => {
            await ctx.reply(`Here is the deposit link of ${ctx.msg?.text}$`, {
                reply_markup: new InlineKeyboard()
                    .url("Pay", response.data.payLink).row()
                    .text("Back", "account"),
                reply_parameters: { message_id: ctx.msgId! }
            })
        })
        .catch(async (error: any) => {
            console.error(error)
            await ctx.reply("Something went wrong, please try again later", {
                reply_markup: new InlineKeyboard()
                    .text("Back", "account")
            })
        })
}

bot.callbackQuery("deposit", async (ctx) => await ctx.conversation.enter("deposit"))

export default bot