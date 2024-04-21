import type { MyContext, MyConversation } from "../../helpers/types"
import { createConversation } from "@grammyjs/conversations"
import { Composer, InlineKeyboard } from "grammy"
import * as db from "../../database/functions"
import { panelHandler } from "./panel"


const bot = new Composer<MyContext>()


bot.use(createConversation(addChannel))
bot.use(createConversation(removeChannel))


async function addChannel(conversation: MyConversation, ctx: MyContext) {
    await ctx.editMessageText("<b>📢 Send channel username with @:</b>", {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "back")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && ctx.message?.text.startsWith("@")) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("<b><i>❗ Invalid username</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "back")
        })
    })

    if (ctx.callbackQuery?.data === "back") return await conversation.external(() => panelHandler(ctx))

    const channel = ctx.message!.text!.trim()

    const channels = await conversation.external(() => db.joinChannels())
    if (channels.includes(channel)) {
        await ctx.reply("<b><i>❗ This channel is already added</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "panel")
        })
        return
    }

    await conversation.external(() => db.addChannel(channel))
    await ctx.reply(`<b>${channel} added successfuly ✅</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "panel")
    })
}

bot.callbackQuery("addChannel", async (ctx) => await ctx.conversation.enter("addChannel"))


async function removeChannel(conversation: MyConversation, ctx: MyContext) {
    await ctx.editMessageText("<b>📢 Send channel username with @:</b>", {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "back")
    })

    ctx = await conversation.waitUntil((ctx) => (ctx.has(":text") && ctx.message?.text.startsWith("@")) || ctx.has("callback_query"), {
        otherwise: async (ctx) => await ctx.reply("<b><i>❗ Invalid username</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "back")
        })
    })

    if (ctx.callbackQuery?.data === "back") return await conversation.external(() => panelHandler(ctx))

    const channel = ctx.message!.text!.trim()

    const channels = await conversation.external(() => db.joinChannels())
    if (!channels.includes(channel)) {
        await ctx.reply("<b><i>❗ This channel is not found</i></b>", {
            reply_markup: new InlineKeyboard()
                .text("🔙 Back", "panel")
        })
        return
    }

    await conversation.external(() => db.removeChannel(channel))
    await ctx.reply(`<b>${channel} removed successfuly ✅</b>`, {
        reply_markup: new InlineKeyboard()
            .text("🔙 Back", "panel")
    })
}

bot.callbackQuery("removeChannel", async (ctx) => await ctx.conversation.enter("removeChannel"))


export default bot