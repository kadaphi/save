import { type MyContext } from "../../helpers/types"
import { Composer, InlineKeyboard } from "grammy"

const bot = new Composer<MyContext>()

const startHandler = async (ctx: MyContext) => {
    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](`👋 Hi, I am '${ctx.me.first_name}' bot.\n\n✅ Send me the Link of any message of Restricted Channels to Clone it here.\n\n✅ Private channels is supported too.\n\n🚫 No Adult Content is Allowed`, {
        reply_markup: new InlineKeyboard()
            .text("👤 Account", "account")
    })
}

bot.command("start", startHandler)
bot.callbackQuery("start", startHandler)

export default bot