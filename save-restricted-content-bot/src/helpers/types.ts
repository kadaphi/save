import type { ConversationFlavor, Conversation } from "@grammyjs/conversations"
import { Context, SessionFlavor } from "grammy"

export interface SessionData {
    dateRange: string
    priceRange: string
    limitRange: string
}

export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor
export type MyConversation = Conversation<MyContext>