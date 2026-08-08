import type { RequestType } from './types'

export const BAG_QUICK_PICKS = [5, 10, 15, 20, 30]

export function firstName(fullName: string) {
  return fullName.split(' ')[0]
}

export const copy = {
  welcome: (name: string) =>
    `Akwaaba to Tallawah Foods, ${firstName(name)} 👋\nTap *🌱 Ackee Ready* below whenever your bags are ready, or just tell me how many.`,

  askBags: (name: string) => `Great news, ${firstName(name)}! 🌿 How many bags of ackee do you have ready today?`,

  bagsNoted: (bags: number) =>
    `${bags} ${bags === 1 ? 'bag' : 'bags'} noted ✅. How should we get them to the depot?`,

  askLocation: () => `Perfect — please share your farm location so we can route a vehicle to you.`,

  locationReceived: () => `📍 Location received. Locking in your pickup request…`,

  askDropoffTiming: () => `No problem — when will you bring it to the Kumasi depot yourself?`,

  clarifyBags: () =>
    `Sorry, I didn't catch a bag count — try a number like "12", or tap one of the quick picks below.`,

  clarifyType: () => `Please choose one — *Team Pickup* or *Self-Drop* — using the buttons below 🙏`,

  nudgeLocationButton: () => `Tap the *📍 Share Farm Location* button below so I can route a driver to you.`,

  clarifyTiming: () => `Please pick *Today*, *Tomorrow*, or *This week* below.`,

  fallback: () =>
    `I can help you log ackee that's ready for pickup. Tap *🌱 Ackee Ready* below to get started, or *📦 My Requests* to check on an existing one.`,

  requestConfirmed: (id: string) =>
    `✅ Request *${id}* received! Our dispatch team will confirm your pickup window here shortly.`,

  routeScheduled: (id: string, driverName: string, dateLabel: string, bags: number) =>
    `🚚 Update on *${id}*: a pickup has been scheduled! ${driverName} will collect your ${bags} bags — ${dateLabel}.`,

  driverEnRoute: (driverName: string) => `🚛 ${driverName} is on the way to your farm now.`,

  collected: (id: string, actualBags: number, estimatedBags: number, name: string) => {
    const diff = actualBags - estimatedBags
    const note =
      diff === 0
        ? ''
        : diff > 0
          ? ` (${diff} more than estimated)`
          : ` (${Math.abs(diff)} fewer than estimated)`
    return `✅ Collected! We picked up ${actualBags} bags${note} from you today. Medaase, ${firstName(name)} 🙏`
  },

  receivedPass: (bags: number, name: string) =>
    `🏭 Received at the Kumasi depot — quality check *passed* on all ${bags} bags. Medaase, ${firstName(name)}!`,

  receivedFail: (name: string) =>
    `⚠️ Your bags arrived at the depot but didn't clear our quality check this time. Our team will reach out about next steps, ${firstName(name)}.`,

  myRequestsEmpty: () => `You don't have any requests logged yet. Tap *🌱 Ackee Ready* to send your first one!`,

  myRequestsHeader: () => `Here's what's on file for you recently:`,
}

export function pickupTypeOptions() {
  return [
    { label: '🚚 Team Pickup', value: 'staff_pickup' as RequestType },
    { label: '🏭 I’ll Self-Drop', value: 'self_drop' as RequestType },
  ]
}

export function dropoffTimingOptions() {
  return [
    { label: 'Today', value: 'Today' },
    { label: 'Tomorrow', value: 'Tomorrow' },
    { label: 'This week', value: 'This week' },
  ]
}

export function bagQuickReplyOptions() {
  return BAG_QUICK_PICKS.map((n) => ({ label: String(n), value: String(n) }))
}

export function statusEmoji(status: string) {
  switch (status) {
    case 'unassigned':
      return '🕓'
    case 'assigned':
      return '🚚'
    case 'fulfilled':
      return '✅'
    case 'flagged':
      return '⚠️'
    default:
      return '•'
  }
}

export function statusLabel(status: string) {
  switch (status) {
    case 'unassigned':
      return 'Pending assignment'
    case 'assigned':
      return 'Pickup scheduled'
    case 'fulfilled':
      return 'Collected'
    case 'flagged':
      return 'Needs attention'
    default:
      return status
  }
}
