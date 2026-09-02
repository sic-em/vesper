import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.interval('presence online webhook', { seconds: 20 }, internal.presenceMonitor.sweep)

export default crons
