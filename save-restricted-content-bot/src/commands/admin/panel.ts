import type { MyContext } from "../../helpers/types"
import { Composer, InlineKeyboard } from "grammy"

const bot = new Composer<MyContext>()

export const panelHandler = async (ctx: MyContext) => {
    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"]("<b>🎛 Admin Panel</b>", {
        reply_markup: new InlineKeyboard()
            .text("➕ Add Channel", "addChannel")
            .text("➖ Remove Channel", "removeChannel").row()
            .text("💰 Set Membership Price", "setPrice").row()
            .text("👥 Referral Commission", "setCommission").row()
            .text("📤 Minimum Withdrawal", "setWithdrawal").row()
            .text("⏳ Set Daily Limit", "setLimit daily").row()
            .text("📆 Set Monthly Limit", "setLimit monthly").row()
    })
}

bot.command("panel", panelHandler)
bot.callbackQuery("panel", panelHandler)

export default bot