import User from "./models/user"
import Bot from "./models/bot"


// BOT FUNCTIONS

export async function bot() {
    return await Bot.findOne({}) || new Bot({})
}

export async function getChannels() {
    const botSettings = await bot()
    return botSettings.channels
}

export async function pushChannel(channel: number) {
    const botSettings = await bot()
    botSettings.channels.push(channel)
    await botSettings.save()
    return botSettings
}

export async function clearChannels() {
    const botSettings = await bot()
    botSettings.channels = []
    await botSettings.save()
    return botSettings
}

export async function joinChannels() {
    const botSettings = await bot()
    return botSettings.joinChannels
}

export async function addChannel(channel: string) {
    const botSettings = await bot()
    botSettings.joinChannels.push(channel)
    await botSettings.save()
    return botSettings
}

export async function removeChannel(channel: string) {
    const botSettings = await bot()
    botSettings.joinChannels = botSettings.joinChannels.filter(chat => chat !== channel)
    await botSettings.save()
    return botSettings
}

export async function setPrice(range: string, amount: number) {
    const botSettings = await bot()
    const price = botSettings.price as any
    price[range] = amount
    await botSettings.save()
    return botSettings
}

export async function getPrice(range: string) {
    const botSettings = await bot()
    const price = botSettings.price as any
    return price[range]
}

export async function setCommission(commission: number) {
    const botSettings = await bot()
    botSettings.commission = commission
    await botSettings.save()
    return botSettings
}

export async function getCommission() {
    const botSettings = await bot()
    return botSettings.commission
}

export async function setWithdraw(amount: number) {
    const botSettings = await bot()
    botSettings.minWith = amount
    await botSettings.save()
    return botSettings
}

export async function getWithdraw() {
    const botSettings = await bot()
    return botSettings.minWith
}

export async function setLimit(range: string, limit: number) {
    const botSettings = await bot()
    const limits = botSettings.limit as any
    limits[range] = limit
    await botSettings.save()
    return botSettings
}

export async function getLimit(range: string) {
    const botSettings = await bot()
    const limits = botSettings.limit as any
    return limits[range]
}


// USER FUNCTIONS

export async function createUser(telegramId: number) {
    const user = new User({ telegramId })
    await user.save()
    return user
}

export async function userExists(telegramId: number) {
    const user = await User.findOne({ telegramId })
    return !!user
}

export async function getUsage(telegramId: number) {
    const user = await User.findOne({ telegramId })
    return user?.usage
}

export async function getExpiry(telegramId: number) {
    const user = await User.findOne({ telegramId })
    return user?.expiry
}

export async function getBalance(telegramId: number) {
    const user = await User.findOne({ telegramId })
    return user?.balance
}

export async function getRefCount(telegramId: number) {
    const user = await User.findOne({ telegramId })
    return user?.refCount
}

export async function addRefCount(telegramId: number) {
    const user = await User.findOne({ telegramId })
    user!.refCount += 1
    await user!.save()
    return user
}

export async function addBalance(telegramId: number, amount: number) {
    const user = await User.findOne({ telegramId })
    user!.balance += amount
    await user!.save()
    return user
}

export async function removeBalance(telegramId: number, amount: number) {
    const user = await User.findOne({ telegramId })
    user!.balance -= amount
    await user!.save()
    return user
}

export async function setReferrer(telegramId: number, referrerId: number) {
    const user = await User.findOne({ telegramId })
    user!.referrer = referrerId
    await user!.save()
    return user
}

export async function addDailyUsage(telegramId: number) {
    const user = await User.findOne({ telegramId })
    user!.usage!.daily += 1
    await user!.save()
    return user
}

export async function addMonthlyUsage(telegramId: number) {
    const user = await User.findOne({ telegramId })
    user!.usage!.monthly += 1
    await user!.save()
    return user
}

export async function addDailyJoins(telegramId: number) {
    const user = await User.findOne({ telegramId })
    user!.usage!.dailyJoins += 1
    await user!.save()
    return user
}

export async function getReferrer(telegramId: number) {
    const user = await User.findOne({ telegramId })
    return user!.referrer
}

export async function setExpiry(telegramId: number, expiry: number) {
    const user = await User.findOne({ telegramId })
    user!.expiry = expiry
    await user!.save()
    return user
}


export async function getExpiryDate(telegramId: number) {
    const user = await User.findOne({ telegramId })
    const expiry = user?.expiry

    const date = new Date(expiry!)

    const day = String(date.getUTCDate()).padStart(2, "0")
    const month = String(date.getUTCMonth() + 1).padStart(2, "0")
    const year = date.getUTCFullYear()
    const hours = String(date.getUTCHours()).padStart(2, "0")
    const minutes = String(date.getUTCMinutes()).padStart(2, "0")
    const seconds = String(date.getUTCSeconds()).padStart(2, "0")

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}


