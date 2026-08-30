import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.daily(
  'prune old notifications',
  { hourUTC: 9, minuteUTC: 0 },
  internal.notifications.pruneOld
)

crons.interval('presence online webhook', { seconds: 20 }, internal.presenceMonitor.sweep)

export default crons
