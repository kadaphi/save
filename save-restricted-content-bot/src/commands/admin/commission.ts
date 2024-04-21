import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"
import { panelHandler } from "./panel"


const bot = new Composer<MyContext>()


bot.use(createConversation(setCommission))


async function setCommission(conversation: MyConversation, ctx: MyContext) {
    await ctx.editMessageText("<b>👥 How much % of deposit you want to set as commission for referrer?</b>", {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "back")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && !isNaN(parseFloat(ctx.message!.text!)) && !ctx.message?.text.includes("+") && !ctx.message?.text.includes("-")) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("<b><i>❗ Invalid Percentage</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "back")
        })
    })

    if (ctx.callbackQuery?.data === "back") return await conversation.external(() => panelHandler(ctx))

    await conversation.external(() => db.setCommission(parseFloat(ctx.message!.text!)))
    await ctx.reply(`<b>✅ Referral commission setted to ${ctx.message!.text!}%</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "panel")
    })
}


bot.callbackQuery("setCommission", async (ctx) => await ctx.conversation.enter("setCommission"))


export default bot