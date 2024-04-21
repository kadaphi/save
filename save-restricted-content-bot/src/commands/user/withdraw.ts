import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"
import { escapers } from "@telegraf/entity"
import { accountHandler } from "./account"


const bot = new Composer<MyContext>()


bot.use(createConversation(withdraw))


async function withdraw(conversation: MyConversation, ctx: MyContext) {
    await ctx.editMessageText("Enter the amount to withdraw in USD", {
        reply_markup: new InlineKeyboard()
            .text("Cancel", "cancel")
    })

    const balance = await db.getBalance(ctx.from!.id) as number

    const minWith = await db.getWithdraw()

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && !isNaN(parseFloat(ctx.msg.text)) && !ctx.msg.text.includes("+") && !ctx.msg.text.includes("-") && balance >= parseFloat(ctx.msg.text) && parseFloat(ctx.message!.text!) >= minWith) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("Invalid Amount", {
            reply_markup: new InlineKeyboard()
                .text("Back", "account"),
            reply_parameters: { message_id: ctx.msgId! }
        })
    })

    if (ctx.callbackQuery?.data === "cancel") return await accountHandler(ctx)

    const amount = ctx.msg!.text

    await ctx.reply("Enter the TRX wallet address:", {
        reply_markup: new InlineKeyboard()
            .text("Cancel", "cancel")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && ctx.msg.text.length > 30) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("Invalid Address", {
            reply_markup: new InlineKeyboard()
                .text("Back", "account"),
            reply_parameters: { message_id: ctx.msgId! }
        })
    })

    if (ctx.callbackQuery?.data === "cancel") return await accountHandler(ctx)

    const address = ctx.msg?.text

    await db.removeBalance(ctx.from!.id, parseFloat(amount!))
    await ctx.api.sendMessage(process.env.ADMIN_ID!, `📤 <b><u>Withdrawal Request</u></b>\n\n👤 <b>User: <a href="tg://user?id=${ctx.from?.id}">${escapers.HTML(ctx.from!.first_name)}</a></b>\n💰 <b>Amount:</b> <code>${amount}$</code>\n💳 <b>TRX address:</b> <code>${address}</code>`, {
        reply_markup: new InlineKeyboard()
            .text("✅ Done", `withdrawDone ${ctx.from!.id} ${amount}`)
            .text("❌ Cancel", `withdrawCancel ${ctx.from!.id} ${amount}`)
    })

    await ctx.reply("Withdrawal has been subitted", {
        reply_markup: new InlineKeyboard()
            .text("Back", "account"),
        reply_parameters: { message_id: ctx.msgId! }
    })
}


bot.callbackQuery("withdraw", async (ctx) => await ctx.conversation.enter("withdraw"))


bot.callbackQuery(/^withdrawDone (.+) (.+)/, async (ctx) => {
    await ctx.deleteMessage()
    await ctx.api.sendMessage(ctx.match[1], `<b>✅ Your withdrawal of ${ctx.match[2]}$ has been done</b>`)
})


bot.callbackQuery(/^withdrawCancel (.+) (.+)/, async (ctx) => {
    await ctx.deleteMessage()
    await db.addBalance(parseInt(ctx.match[1]), parseFloat(ctx.match[2] as string))
    await ctx.api.sendMessage(ctx.match[1], `<b>❌ Your withdrawal of ${ctx.match[2]}$ has been cancelled</b>`)
})


export default bot