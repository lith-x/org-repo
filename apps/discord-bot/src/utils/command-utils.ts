import {
  type CommandInteraction,
  GuildChannel,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
  ThreadChannel,
} from 'discord.js'

import { FormatUtils, InteractionUtils } from './index.js'
import { type Command } from '../commands/index.js'
import { Permission } from '../models/enum-helpers/index.js'
import { type EventData } from '../models/internal-models.js'
import { Lang } from '../services/index.js'

export class CommandUtils {
  public static findCommand(commands: Command[], commandParts: string[]): Command | null {
    let found = [...commands]
    let closestMatch: Command | null = null
    for (const [index, commandPart] of commandParts.entries()) {
      found = found.filter((command) => command.names[index] === commandPart)
      if (found.length === 0) {
        return null
      }

      if (found.length === 1) {
        return found[0] ?? null
      }

      const exactMatch = found.find((command) => command.names.length === index + 1)
      if (exactMatch) {
        closestMatch = exactMatch
      }
    }
    return closestMatch
  }

  public static async runChecks(
    command: Command,
    intr: CommandInteraction | MessageComponentInteraction | ModalSubmitInteraction,
    data: EventData,
  ): Promise<boolean> {
    if (command.cooldown) {
      const limited = command.cooldown.take(intr.user.id)
      if (limited) {
        await InteractionUtils.send(
          intr,
          Lang.getEmbed('validationEmbeds.cooldownHit', data.lang, {
            AMOUNT: command.cooldown.amount.toLocaleString(data.lang),
            INTERVAL: FormatUtils.duration(command.cooldown.interval, data.lang),
          }),
        )
        return false
      }
    }

    if (
      (intr.channel instanceof GuildChannel || intr.channel instanceof ThreadChannel) &&
      !intr.channel.permissionsFor(intr.client.user)?.has(command.requireClientPerms)
    ) {
      await InteractionUtils.send(
        intr,
        Lang.getEmbed('validationEmbeds.missingClientPerms', data.lang, {
          PERMISSIONS: command.requireClientPerms
            .map((perm) => `**${Permission.Data[perm].displayName(data.lang)}**`)
            .join(', '),
        }),
      )
      return false
    }

    return true
  }
}
