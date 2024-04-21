import "dotenv/config"
import { conversations } from "@grammyjs/conversations"
import { StringSession } from "telegram/sessions"
import { Bot, InputFile, session } from "grammy"
import { type MyContext } from "./helpers/types"
import { autoRetry } from "@grammyjs/auto-retry"
import { parseMode } from "@grammyjs/parse-mode"
import { Api, TelegramClient } from "telegram"
import * as db from "./database/functions"
import { ChatMember } from "grammy/types"
import { input } from "@inquirer/prompts"
import User from "./database/models/user"
import validator from "validator"
import ngrok from "@ngrok/ngrok"
import mongoose from "mongoose"
import fastify from "fastify"
import cron from "node-cron"
import fs from "node:fs"


const stringSession = new StringSession(process.env.SESSION_STRING)
const client = new TelegramClient(stringSession, parseInt(process.env.API_ID!), process.env.API_HASH!, { connectionRetries: 5 })
const bot = new Bot<MyContext>(process.env.BOT_TOKEN!)
const app = fastify();

(async () => {
    await client.start({
        phoneNumber: async () => await input({ message: "Enter your phone number:" }),
        password: async () => await input({ message: "Enter your password:" }),
        phoneCode: async () => await input({ message: "Enter the code you received:" }),
        onError: (error) => console.error(error.message)
    })
})();


fs.readFile(".env", "utf8", (error, data) => {
    if (error) return console.error(error)

    const lines = data.split("\n")
    const index = lines.findIndex((line) => line.startsWith("SESSION_STRING"))

    if (index !== -1) lines[index] = `SESSION_STRING="${client.session.save()}"`
    else lines.push(`SESSION_STRING="${client.session.save()}"`)

    fs.writeFile(".env", lines.join("\n"), "utf8", (error) => { if (error) return console.error(error) })
})


bot.catch(async (error) => {
    if (error.ctx.has("callback_query")) await error.ctx.editMessageText("<b>❌ Something went wrong</b>", { parse_mode: "HTML" })
    else await error.ctx.reply("<b>❌ Something went wrong</b>", { parse_mode: "HTML", reply_parameters: { message_id: error.ctx.message!.message_id } })

    console.error(`⚠ Error report from ${error.ctx.from!.id}: ${error}`)

    await error.ctx.api.sendDocument(process.env.ADMIN_ID!, new InputFile(Buffer.from(JSON.stringify({
        cause: error.cause,
        stack: error.stack,
        message: error.message,
        ctx: error.ctx,
    }, null, 4)), `ctx ${error.ctx.update.update_id}.json`), {
        caption: `<b>⚠ Error report from <code>${error.ctx.from!.id}</code></b>`,
        parse_mode: "HTML"
    })
})


async function saveContent(userId: number, chatId: string | number, message_id: number, replyId: number) {
    try {
        const expiry = await db.getExpiry(userId)
        const usage = await db.getUsage(userId)

        if (Date.now() > expiry! && parseInt(process.env.ADMIN_ID!) !== userId) {
            const dailyLimit = await db.getLimit("daily")
            const monthlyLimit = await db.getLimit("monthly")
            if (usage?.monthly! >= monthlyLimit) return await bot.api.sendMessage(userId, "Your daily monthly quota is only 16", { reply_parameters: { message_id: replyId } })
            if (usage?.daily! >= dailyLimit) return await bot.api.sendMessage(userId, "Your daily free quota is only 4", { reply_parameters: { message_id: replyId } })
        }

        await bot.api.sendMessage(userId, "<b>📥 Download Started...</b>\n\n<i>Content will reach to you soon</i>", { parse_mode: "HTML", reply_parameters: { message_id: replyId } })

        const message = await client.getMessages(chatId, { ids: [message_id] })

        const media = await message[0].downloadMedia()
        const file = new InputFile(Buffer.from(media!))


        await db.addDailyUsage(userId)
        await db.addMonthlyUsage(userId)

        if (message[0].video) {
            try {
                await bot.api.sendVideo(userId, file, { caption: message[0].text, parse_mode: "HTML", reply_parameters: { message_id: replyId } })
            } catch (error) {
                await bot.api.sendVideo(userId, file, { caption: message[0].message, reply_parameters: { message_id: replyId } })
            }
            return
        }

        if (message[0].document) {
            try {
                await bot.api.sendDocument(userId, file, { caption: message[0].text, parse_mode: "HTML", reply_parameters: { message_id: replyId } })
            } catch (error) {
                await bot.api.sendDocument(userId, file, { caption: message[0].message, reply_parameters: { message_id: replyId } })
            }
            return
        }

        if (message[0].gif) {
            try {
                await bot.api.sendAnimation(userId, file, { caption: message[0].text, parse_mode: "HTML", reply_parameters: { message_id: replyId } })
            } catch (error) {
                await bot.api.sendAnimation(userId, file, { caption: message[0].message, reply_parameters: { message_id: replyId } })
            }
            return
        }


        if (message[0].sticker) {
            await bot.api.sendSticker(userId, file, { reply_parameters: { message_id: replyId } })
            return
        }

        if (message[0].voice) {
            try {
                await bot.api.sendVoice(userId, file, { caption: message[0].text, parse_mode: "HTML", reply_parameters: { message_id: replyId } })
            } catch (error) {
                await bot.api.sendVoice(userId, file, { caption: message[0].message, reply_parameters: { message_id: replyId } })
            }
            return
        }

        if (message[0].audio) {
            try {
                await bot.api.sendAudio(userId, file, { caption: message[0].text, parse_mode: "HTML", reply_parameters: { message_id: replyId } })
            } catch (error) {
                await bot.api.sendAudio(userId, file, { caption: message[0].message, reply_parameters: { message_id: replyId } })
            }
            return
        }

        if (message[0].photo) {
            try {
                await bot.api.sendPhoto(userId, file, { caption: message[0].text, parse_mode: "HTML", reply_parameters: { message_id: replyId } })
            } catch (error) {
                await bot.api.sendPhoto(userId, file, { caption: message[0].message, reply_parameters: { message_id: replyId } })
            }
            return
        }

        try {
            await bot.api.sendMessage(userId, message[0].text, { parse_mode: "HTML", reply_parameters: { message_id: replyId } })
        } catch (error) {
            await bot.api.sendMessage(userId, message[0].message, { reply_parameters: { message_id: replyId } })
        }
    } catch (error) {
        await bot.api.sendMessage(userId, "<b>⚠ This bot doesn't have access to the channel, please provide an invite link of the channel</b>", { parse_mode: "HTML", reply_parameters: { message_id: replyId } })
        return
    }
}


bot.api.config.use(autoRetry())
bot.api.config.use(parseMode("HTML"))

client.setParseMode("html")

bot.use(session({ initial: () => ({}) }))

bot.use(conversations())


bot.on(["message", "callback_query"], async (ctx, next) => {
    if (ctx.chat?.type !== "private") return
    await next()
})


bot.on(":text", async (ctx, next) => {
    if (ctx.message?.text.startsWith('/start')) {
        var referralID = ctx.message.text.split(' ')[1]
        if (await db.userExists(ctx.from.id) || !referralID || !await db.userExists(parseInt(referralID))) {
            await next()
            return
        }

        await db.createUser(ctx.from.id)
        await db.addRefCount(parseInt(referralID))
        await db.setReferrer(ctx.from.id, parseInt(referralID))

        await ctx.api.sendMessage(referralID, 'Someone joined with your link!')
    }
    await next()
})


bot.on(["message", "callback_query"], async (ctx, next) => {
    if (await db.userExists(ctx.from.id)) return await next()
    await db.createUser(ctx.from.id)
    await next()
})


bot.on(["message", "callback_query"], async (ctx, next) => {
    const channels = await db.joinChannels()
    const notJoinedChannels: string[] = []

    for (const channel of channels) {
        const member = await ctx.api.getChatMember(channel.trim(), ctx.from.id).catch(error => error.status = "left") as ChatMember
        if (member.status === "left" || member.status === "kicked") {
            notJoinedChannels.push(channel.trim())
        }
    }

    if (notJoinedChannels.length !== 0) {
        if (ctx.has("callback_query"))
            await ctx.answerCallbackQuery({ text: "You didn't joined our channels", show_alert: true })
        else
            await ctx.reply(`<b>⚠ You must join these channels to use the bot!\n - ${notJoinedChannels.join("\n - ")} </b>`)
        return
    }

    await next()
})


bot.on("message:text", async (ctx, next) => {
    if (validator.isURL(ctx.message.text)) {
        if (ctx.message.text.startsWith("https://t.me/+")) {
            try {
                const result = await client.invoke(new Api.messages.ImportChatInvite({ hash: ctx.message.text.split("+")[1] }))
                const chatId = (result as { chats: any[] })?.chats?.[0]?.id
                await db.pushChannel(Number(chatId))
                await db.addDailyJoins(ctx.from.id)
                await ctx.reply("<b>✅ Joined in the channel</b>", { reply_parameters: { message_id: ctx.message.message_id } })
            } catch (error: any) {
                if (error.errorMessage === "CHANNELS_TOO_MUCH") {
                    const channels = await db.getChannels()
                    for (const channel of channels) await client.invoke(new Api.channels.LeaveChannel({ channel: `-100${channel}` }))
                    await db.clearChannels()
                    const result = await client.invoke(new Api.messages.ImportChatInvite({ hash: ctx.message.text.split("+")[1] }))
                    const chatId = (result as { chats: any[] })?.chats?.[0]?.id
                    await db.pushChannel(Number(chatId))
                    await db.addDailyJoins(ctx.from.id)
                    await ctx.reply("<b>✅ Joined in the channel</b>", { reply_parameters: { message_id: ctx.message.message_id } })
                } else if (error.errorMessage === "INVITE_REQUEST_SENT") {
                    await ctx.reply("<b>✅ Join request sent</b>", { reply_parameters: { message_id: ctx.message.message_id } })
                } else if (error.errorMessage === "USER_ALREADY_PARTICIPANT") {
                    await ctx.reply("<b>User already participant</b>", { reply_parameters: { message_id: ctx.message.message_id } })
                }
            }
        } else if (ctx.message.text.startsWith("https://t.me/")) {
            const args = ctx.message.text.split("/")
            const temp = args[args.length - 1].replace("?single", "").split("-")
            const fromID = parseInt(temp[0].trim())
            const toID = temp[1] ? parseInt(temp[1].trim()) : fromID

            for (let msgid = fromID; msgid <= toID; msgid++) {
                if (ctx.message.text.startsWith("https://t.me/c/")) {
                    const chatId = parseInt("-100" + args[4])
                    await saveContent(ctx.from.id, chatId, msgid, ctx.message.message_id)
                } else if (ctx.message.text.startsWith("https://t.me/b/")) {
                    await saveContent(ctx.from.id, args[4], msgid, ctx.message.message_id)
                } else {
                    await saveContent(ctx.from.id, args[3], msgid, ctx.message.message_id)
                }
            }
        }
    }

    await next()
})


import start from "./commands/user/start"
import account from "./commands/user/account"
import deposit from "./commands/user/deposit"
import withdraw from "./commands/user/withdraw"
import membership from "./commands/user/membership"

bot.use(start)
bot.use(account)
bot.use(deposit)
bot.use(withdraw)
bot.use(membership)


bot.on(["message", "callback_query"], async (ctx, next) => {
    if (ctx.from!.id !== parseInt(process.env.ADMIN_ID!)) return
    await next()
})


import panel from "./commands/admin/panel"
import channel from "./commands/admin/channel"
import price from "./commands/admin/price"
import commission from "./commands/admin/commission"
import withdrawal from "./commands/admin/withdraw"
import limit from "./commands/admin/limit"

bot.use(panel)
bot.use(channel)
bot.use(price)
bot.use(commission)
bot.use(withdrawal)
bot.use(limit)


cron.schedule("0 0 0 * * *", async () => {
    try {
        const users = await User.find({})
        for (const user of users) {
            user!.usage!.daily = 0
            user!.usage!.dailyJoins = 0
            await user!.save()
        }
    } catch (error) {
        console.error(error)
    }
}, {
    scheduled: true,
    recoverMissedExecutions: true
})

cron.schedule("0 0 0 1 * *", async () => {
    try {
        const users = await User.find({})
        for (const user of users) {
            user!.usage!.monthly = 0
            await user!.save()
        }
    } catch (error) {
        console.error(error)
    }
}, {
    scheduled: true,
    recoverMissedExecutions: true
})


app.all("/callback/deposit/:id", async (req: any, reply) => {
    try {
        if (isNaN(req.params.id)) return reply.type("application/json").code(400).send({ ok: false, message: "Invalid user/message ID" })

        const query = req.body || req.query
        for (let key in query) {
            if (!isNaN(query[key]) && query[key] !== "") {
                query[key] = parseFloat(query[key])
            }
        }

        if (query.status === "Paid") {
            const referrer = await db.getReferrer(parseInt(req.params.id))
            if (referrer !== 0) {
                const commission = await db.getCommission()
                const amount = parseFloat(query.price) * (commission / 100)
                await db.addBalance(referrer, amount)
                await bot.api.sendMessage(referrer, `You got ${amount}$ as referral commission`)
            }

            await db.addBalance(parseInt(req.params.id), parseFloat(query.price))
            await bot.api.sendMessage(req.params.id, `✅ <b><u>Deposit Confirmed</u></b>\n\n🆔 <b>Track ID:</b> <code>${query.trackId}</code>\n💰 <b>Amount:</b> <code>${parseFloat(query.payAmount).toFixed(2)} ${query.payCurrency}-${query.network}</code>\n💸 <b>Price:</b> <code>${parseFloat(query.price).toFixed(2)}$</code>\n💳 <b>Transaction ID:</b> <code>${query.txID}</code>`)
            await bot.api.sendMessage(process.env.ADMIN_ID!, `<b><u>NEW DEPOSIT</u></b>\n\n• ID: <code>${req.params.id}</code>\n• AMOUNT: <code>${parseFloat(query.price).toFixed(2)}$</code>\n• TXID: <code>${query.txID}</code>`)
            await bot.api.sendMessage(process.env.DEPOSIT_CHANNEL!, `<b><u>NEW DEPOSIT</u></b>\n\n• ID: <code>${req.params.id}</code>\n• AMOUNT: <code>${parseFloat(query.price).toFixed(2)}$</code>\n• TXID: <code>${query.txID}</code>`)
            reply.type("application/json").code(200).send({ ok: true, message: "success" })
        } else {
            reply.type("application/json").code(400).send({ ok: false, message: "Invalid status" })
        }
    } catch (error) {
        console.error(error)
    }
})


app.listen({ port: parseInt(process.env.PORT!) }, async (error) => {
    if (error) {
        console.error("Error while connecting to fastify:", error)
        process.exit(1)
    }

    await ngrok.forward({
        addr: process.env.PORT,
        authtoken_from_env: true,
        domain: process.env.DOMAIN
    })

    mongoose.connect(process.env.MONGO_URI!, { dbName: process.env.DATABASE_NAME })
        .then(() => {
            console.log("Connected to MongoDB")
            bot.start({
                drop_pending_updates: true,
                allowed_updates: ["message", "callback_query"],
                onStart: (bot) => console.log(`@${bot.username} started...`)
            })
        })
        .catch((error) => {
            console.error("Error while connecting to MongoDB: ", error)
        })
})