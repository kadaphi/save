import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"
import { panelHandler } from "./panel"


const bot = new Composer<MyContext>()


bot.use(createConversation(setWithdrawal))


async function setWithdrawal(conversation: MyConversation, ctx: MyContext) {
    await ctx.editMessageText("<b>📤 Send the minimum withdraw amount:</b>", {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "back")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && !isNaN(parseFloat(ctx.message!.text!)) && !ctx.message?.text.includes("+") && !ctx.message?.text.includes("-")) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("<b><i>❗ Invalid Amount</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "back")
        })
    })

    if (ctx.callbackQuery?.data === "back") return await conversation.external(() => panelHandler(ctx))

    await conversation.external(() => db.setWithdraw(parseFloat(ctx.message!.text!)))
    await ctx.reply(`<b>✅ Minimum withdrawal setted to ${ctx.message!.text!}$</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "panel")
    })
}


bot.callbackQuery("setWithdrawal", async (ctx) => await ctx.conversation.enter("setWithdrawal"))


export default bot