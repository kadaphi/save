import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"


const bot = new Composer<MyContext>()


bot.use(createConversation(setPrice))


const priceHandler = async (ctx: MyContext) => {
    await ctx.editMessageText("<b>📆 Choose a date range:</b>", {
        reply_markup: new InlineKeyboard()
            .text("▫ Daily", "membershipPrice daily")
            .text("◽ Weekly", "membershipPrice weekly").row()
            .text("◻ Monthly", "membershipPrice monthly")
            .text("⬜ Yearly", "membershipPrice yearly").row()
            .text("🔙 Back", "panel")
    })
}

bot.callbackQuery("setPrice", priceHandler)


async function setPrice(conversation: MyConversation, ctx: MyContext) {
    const priceRange = conversation.session.priceRange
    await ctx.editMessageText(`<b>❓ How much USD you want to be the price for membership per ${priceRange}</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "back")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && !isNaN(parseFloat(ctx.message!.text!)) && !ctx.message?.text.includes("+") && !ctx.message?.text.includes("-")) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("<b><i>❗ Invalid Amount</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "back")
        })
    })

    if (ctx.callbackQuery?.data === "back") return await conversation.external(() => priceHandler(ctx))

    const amount = ctx.message!.text!

    await conversation.external(() => db.setPrice(priceRange, parseFloat(amount)))
    await ctx.reply(`<b>✅ ${priceRange.charAt(0).toUpperCase() + priceRange.slice(1)} membership price setted to ${amount}$</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "setPrice")
    })
}

bot.callbackQuery(/^membershipPrice (.+)/, async (ctx) => {
    ctx.session.priceRange = ctx.match[1]
    await ctx.conversation.enter("setPrice")
})


export default bot