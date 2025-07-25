import { ShardingManager } from 'discord.js'
import { createRequire } from 'node:module'
import 'reflect-metadata'

import { GuildsController, RootController, ShardsController } from './controllers/index.js'
import { type Job, UpdateServerCountJob } from './jobs/index.js'
import { Api } from './models/api.js'
import { Manager } from './models/manager.js'
import { HttpService, JobService, Logger, MasterApiService } from './services/index.js'
import { MathUtils, ShardUtils } from './utils/index.js'

const require = createRequire(import.meta.url)
const Config = require('../config/config.json')
const Debug = require('../config/debug.json')
const Logs = require('../lang/logs.json')

async function start(): Promise<void> {
  Logger.info(Logs.info.appStarted)

  // Dependencies
  const httpService = new HttpService()
  const masterApiService = new MasterApiService(httpService)
  if (Config.clustering.enabled) {
    await masterApiService.register()
  }

  // Sharding
  let shardList: number[]
  let totalShards: number
  try {
    if (Config.clustering.enabled) {
      const resBody = await masterApiService.login()
      shardList = resBody.shardList
      const requiredShards = await ShardUtils.requiredShardCount(process.env.DISCORD_BOT_TOKEN)
      totalShards = Math.max(requiredShards, resBody.totalShards)
    } else {
      const recommendedShards = await ShardUtils.recommendedShardCount(
        process.env.DISCORD_BOT_TOKEN,
        Config.sharding.serversPerShard,
      )
      shardList = MathUtils.range(0, recommendedShards)
      totalShards = recommendedShards
    }
  } catch (error) {
    Logger.error(Logs.error.retrieveShards, error)
    return
  }

  if (shardList.length === 0) {
    Logger.warn(Logs.warn.managerNoShards)
    return
  }

  const shardManager = new ShardingManager('dist/start-bot.js', {
    token: process.env.DISCORD_BOT_TOKEN,
    mode: Debug.override.shardMode.enabled ? Debug.override.shardMode.value : 'process',
    respawn: true,
    totalShards,
    shardList,
  })

  // Jobs
  const jobs = [
    Config.clustering.enabled ? undefined : new UpdateServerCountJob(shardManager, httpService),
    // TODO: Add new jobs here
  ].filter(Boolean) as Job[]

  const manager = new Manager(shardManager, new JobService(jobs))

  // API
  const guildsController = new GuildsController(shardManager)
  const shardsController = new ShardsController(shardManager)
  const rootController = new RootController()
  const api = new Api([guildsController, shardsController, rootController])

  // Start
  await manager.start()
  await api.start()
  if (Config.clustering.enabled) {
    await masterApiService.ready()
  }
}

process.on('unhandledRejection', (reason, _promise) => {
  Logger.error(Logs.error.unhandledRejection, reason)
})

start().catch((error) => {
  Logger.error(Logs.error.unspecified, error)
})
