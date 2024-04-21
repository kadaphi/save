import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"
import { MyContext } from "../../helpers/types"

const bot = new Composer<MyContext>()

export const accountHandler = async (ctx: MyContext) => {
    const usage = await db.getUsage(ctx.from!.id)
    const expiry = await db.getExpiry(ctx.from!.id)
    const balance = await db.getBalance(ctx.from!.id)
    const refCount = await db.getRefCount(ctx.from!.id)
    const refLink = `https://t.me/${ctx.me.username}?start=${ctx.from!.id}`
    const commission = await db.getCommission()

    await ctx.editMessageText(`📊 User: ${ctx.from!.id}\n💰 Balance: ${balance!.toFixed(2)}$\n\n⭐️ today usage: ${usage?.daily}\n⭐️ this month usage: ${usage?.monthly}\n⭐️ today joins: ${usage?.dailyJoins}\n\n✅ Plan: ${Date.now() > expiry! ? "Free" : "Paid"}\n\n✅ Invites: (${refCount} 👤)\n💎 Your Invite Link:\n${refLink}\n - For each deposit, you'll earn ${commission}% of the payment.`, {
        reply_markup: new InlineKeyboard()
            .text("➕ Deposit", "deposit")
            .text("➖ Withdraw", "withdraw").row()
            .text("🛒 Buy Membership", "buyMembership").row()
            .text("🔙 Back", "start")
    })
}

bot.callbackQuery("account", accountHandler)

export default bot