import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"
import { accountHandler } from "./account"


const bot = new Composer<MyContext>()


bot.use(createConversation(buy))


bot.callbackQuery("buyMembership", async (ctx) => {
    await ctx.editMessageText("Select a date range:", {
        reply_markup: new InlineKeyboard()
            .text("▫ Daily", "buy day")
            .text("◽ Weekly", "buy week").row()
            .text("◻ Monthly", "buy month")
            .text("⬜ Yearly", "buy year").row()
            .text("🔙 Back", "account")
    })
})


async function buy(conversation: MyConversation, ctx: MyContext) {
    const dateRange = ctx.session.dateRange
    await ctx.editMessageText(`for how much ${dateRange}s you want to purchase membership?`, {
        reply_markup: new InlineKeyboard()
            .text("Cancel", "cancel")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && !isNaN(parseFloat(ctx.msg.text)) && !ctx.msg.text.includes("+") && !ctx.msg.text.includes("-") && parseFloat(ctx.msg.text) >= 1 && Number.isInteger(parseFloat(ctx.msg.text))) || ctx.has("callback_query"), {
        otherwise: async (ctx) => {
            return await ctx.reply(`Invalid ${dateRange}s`, {
                reply_markup: new InlineKeyboard()
                    .text("Back", "account")
            })
        }
    })

    if (ctx.callbackQuery?.data === "cancel") return await accountHandler(ctx)

    const reponse = parseInt(ctx.msg!.text!)

    const daily = await db.getPrice("daily")
    const weekly = await db.getPrice("weekly")
    const monthly = await db.getPrice("monthly")
    const yearly = await db.getPrice("yearly")

    let amount = 0
    let days = 0

    if (dateRange === "day") {
        amount = daily * reponse
        days = 24 * 60 * 60 * 1000 * reponse
    }
    if (dateRange === "week") {
        amount = weekly * reponse
        days = 7 * 24 * 60 * 60 * 1000 * reponse
    }
    if (dateRange === "month") {
        amount = monthly * reponse
        days = 30 * 24 * 60 * 60 * 1000 * reponse
    }
    if (dateRange === "year") {
        amount = yearly * reponse
        days = 360 * 24 * 60 * 60 * 1000 * reponse
    }

    const balance = await db.getBalance(ctx.from!.id) as number
    const expiry = await db.getExpiry(ctx.from!.id) as number
    if (balance >= amount) {
        await db.removeBalance(ctx.from!.id, amount)
        if (Date.now() > expiry) {
            await db.setExpiry(ctx.from!.id, new Date(Date.now() + days).getTime())
        } else {
            await db.setExpiry(ctx.from!.id, new Date(expiry + days).getTime())
        }

        const date = await db.getExpiryDate(ctx.from!.id)

        await ctx.reply(`✅ Membership is valid upto ${date}`, {
            reply_markup: new InlineKeyboard()
                .text("Back", "account")
        })
    } else {
        await ctx.reply("Insufficient Balance", {
            reply_markup: new InlineKeyboard()
                .text("Back", "account")
        })
    }
}


bot.callbackQuery(/^buy (.+)/, async (ctx) => {
    ctx.session.dateRange = ctx.match[1]
    await ctx.conversation.enter("buy")
})


export default bot