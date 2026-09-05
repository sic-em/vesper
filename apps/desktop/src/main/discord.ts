import { Client } from '@xhayper/discord-rpc'
import { ActivityType } from 'discord-api-types/v10'

const DISCORD_APP_ID = '1199569000296878100'
const STATUS_DISPLAY_DETAILS = 2

export interface DiscordActivityInput {
  details: string
  state: string
  largeImage: string
  largeText: string
  startTimestamp?: number
  endTimestamp?: number
}

class DiscordRpc {
  private client: Client | null = null
  private connecting: Promise<void> | null = null
  private ready = false

  private async ensureConnected(): Promise<void> {
    if (this.ready && this.client) return
    if (this.connecting) return this.connecting
    this.connecting = (async () => {
      const client = new Client({ clientId: DISCORD_APP_ID })
      client.on('ready', () => {
        this.ready = true
      })
      client.transport.on('close', () => {
        this.ready = false
        this.client = null
      })
      try {
        await client.login()
        this.client = client
        this.ready = true
        console.log('[discord] connected')
      } catch (err) {
        console.warn('[discord] connect failed', err)
        this.client = null
        this.ready = false
      } finally {
        this.connecting = null
      }
    })()
    return this.connecting
  }

  async setActivity(input: DiscordActivityInput): Promise<void> {
    await this.ensureConnected()
    if (!this.client || !this.ready || !this.client.user) return
    try {
      await this.client.user.setActivity({
        type: ActivityType.Watching,
        statusDisplayType: STATUS_DISPLAY_DETAILS,
        details: input.details,
        state: input.state,
        // An empty image means no image — never a broken placeholder key.
        largeImageKey: input.largeImage || undefined,
        largeImageText: input.largeImage ? input.largeText : undefined,
        startTimestamp: input.startTimestamp ? input.startTimestamp * 1000 : undefined,
        endTimestamp: input.endTimestamp ? input.endTimestamp * 1000 : undefined,
        buttons: [{ label: 'Watch on Vesper', url: 'https://vespr.dev' }]
      })
    } catch (err) {
      console.warn('[discord] setActivity error', err)
      this.ready = false
      this.client = null
    }
  }

  async clearActivity(): Promise<void> {
    if (!this.client || !this.ready || !this.client.user) return
    try {
      await this.client.user.clearActivity()
    } catch {
      // noop
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) return
    try {
      await this.client.destroy()
    } catch {
      // noop
    }
    this.client = null
    this.ready = false
  }
}

const rpc = new DiscordRpc()

export function setDiscordActivity(input: DiscordActivityInput): Promise<void> {
  return rpc.setActivity(input)
}

export function clearDiscordActivity(): Promise<void> {
  return rpc.clearActivity()
}

export function disconnectDiscord(): Promise<void> {
  return rpc.disconnect()
}
