import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"
import { panelHandler } from "./panel"


const bot = new Composer<MyContext>()


bot.use(createConversation(setLimit))


async function setLimit(conversation: MyConversation, ctx: MyContext) {
    const range = conversation.session.limitRange

    await ctx.editMessageText(`<b>⏳ Send the ${range} limit:</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "back")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && !isNaN(parseFloat(ctx.message!.text!)) && !ctx.message?.text.includes("+") && !ctx.message?.text.includes("-") && parseFloat(ctx.msg.text) >= 1 && Number.isInteger(parseFloat(ctx.msg.text))) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("<b><i>❗ Invalid Limit</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "back")
        })
    })

    if (ctx.callbackQuery?.data === "back") return await conversation.external(() => panelHandler(ctx))

    await conversation.external(() => db.setLimit(range, parseInt(ctx.message!.text!)))
    await ctx.reply(`<b>✅ ${range.charAt(0).toUpperCase() + range.slice(1)} limit setted to ${ctx.message!.text!}</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "panel")
    })
}


bot.callbackQuery(/^setLimit (.+)/, async (ctx) => {
    ctx.session.limitRange = ctx.match[1]
    await ctx.conversation.enter("setLimit")
})


export default bot