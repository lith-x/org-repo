import {
  type BaseMessageOptions,
  DiscordAPIError,
  RESTJSONErrorCodes as DiscordApiErrors,
  EmbedBuilder,
  type EmojiResolvable,
  type Message,
  type MessageEditOptions,
  type MessageReaction,
  PartialGroupDMChannel,
  type StartThreadOptions,
  type TextBasedChannel,
  type ThreadChannel,
  type User,
} from 'discord.js'

const IGNORED_ERRORS = [
  DiscordApiErrors.UnknownMessage,
  DiscordApiErrors.UnknownChannel,
  DiscordApiErrors.UnknownGuild,
  DiscordApiErrors.UnknownUser,
  DiscordApiErrors.UnknownInteraction,
  DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
  DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
  DiscordApiErrors.MaximumActiveThreads,
]

export class MessageUtils {
  public static async send(
    target: User | TextBasedChannel,
    content: string | EmbedBuilder | BaseMessageOptions,
  ): Promise<Message | null> {
    if (target instanceof PartialGroupDMChannel) return null
    try {
      const options: BaseMessageOptions =
        typeof content === 'string'
          ? { content }
          : content instanceof EmbedBuilder
            ? { embeds: [content] }
            : content
      return await target.send(options)
    } catch (error) {
      if (
        error instanceof DiscordAPIError &&
        typeof error.code == 'number' &&
        IGNORED_ERRORS.includes(error.code)
      ) {
        return null
      } else {
        throw error
      }
    }
  }

  public static async reply(
    msg: Message,
    content: string | EmbedBuilder | BaseMessageOptions,
  ): Promise<Message | null> {
    try {
      const options: BaseMessageOptions =
        typeof content === 'string'
          ? { content }
          : content instanceof EmbedBuilder
            ? { embeds: [content] }
            : content
      return await msg.reply(options)
    } catch (error) {
      if (
        error instanceof DiscordAPIError &&
        typeof error.code == 'number' &&
        IGNORED_ERRORS.includes(error.code)
      ) {
        return null
      } else {
        throw error
      }
    }
  }

  public static async edit(
    msg: Message,
    content: string | EmbedBuilder | MessageEditOptions,
  ): Promise<Message | null> {
    try {
      const options: MessageEditOptions =
        typeof content === 'string'
          ? { content }
          : content instanceof EmbedBuilder
            ? { embeds: [content] }
            : content
      return await msg.edit(options)
    } catch (error) {
      if (
        error instanceof DiscordAPIError &&
        typeof error.code == 'number' &&
        IGNORED_ERRORS.includes(error.code)
      ) {
        return null
      } else {
        throw error
      }
    }
  }

  public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction | null> {
    try {
      return await msg.react(emoji)
    } catch (error) {
      if (
        error instanceof DiscordAPIError &&
        typeof error.code == 'number' &&
        IGNORED_ERRORS.includes(error.code)
      ) {
        return null
      } else {
        throw error
      }
    }
  }

  public static async pin(msg: Message, pinned: boolean = true): Promise<Message | null> {
    try {
      return pinned ? await msg.pin() : await msg.unpin()
    } catch (error) {
      if (
        error instanceof DiscordAPIError &&
        typeof error.code == 'number' &&
        IGNORED_ERRORS.includes(error.code)
      ) {
        return null
      } else {
        throw error
      }
    }
  }

  public static async startThread(
    msg: Message,
    options: StartThreadOptions,
  ): Promise<ThreadChannel | null> {
    try {
      return await msg.startThread(options)
    } catch (error) {
      if (
        error instanceof DiscordAPIError &&
        typeof error.code == 'number' &&
        IGNORED_ERRORS.includes(error.code)
      ) {
        return null
      } else {
        throw error
      }
    }
  }

  public static async delete(msg: Message): Promise<Message | null> {
    try {
      return await msg.delete()
    } catch (error) {
      if (
        error instanceof DiscordAPIError &&
        typeof error.code == 'number' &&
        IGNORED_ERRORS.includes(error.code)
      ) {
        return null
      } else {
        throw error
      }
    }
  }
}
