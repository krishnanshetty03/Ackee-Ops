import type { Branch, Language, RequestType } from './types'

export const BAG_QUICK_PICKS = [5, 10, 15, 20, 30]

export function firstName(fullName: string) {
  return fullName.split(' ')[0]
}

// Shown before a farmer has picked a language, so it has to carry in both at once.
export const LANGUAGE_PROMPT = `🌐 Please choose your language, or paw wo kasa:`

export function languageOptions() {
  return [
    { label: 'English', value: 'en' as Language },
    { label: 'Twi', value: 'tw' as Language },
  ]
}

// Twi renderings are simple, best-effort SMS-register phrasing — product/place names
// (Ackee, Tallawah, branch names, request ids) are left as-is rather than translated,
// same convention real bilingual bots use for proper nouns.
const copyEn = {
  welcome: (name: string) =>
    `Akwaaba to Tallawah Foods, ${firstName(name)} 👋\nTap *🌱 Ackee Ready* below whenever your bags are ready, or just tell me how many.`,
  askBags: (name: string) => `Great news, ${firstName(name)}! 🌿 How many bags of ackee do you have ready today?`,
  bagsNoted: (bags: number) => `${bags} ${bags === 1 ? 'bag' : 'bags'} noted ✅. Which of our branches is closest to your farm?`,
  branchChosen: (branchName: string) => `Got it — *${branchName}* it is. How should we get your bags there?`,
  askLocation: () => `Perfect — please share your farm location so we can route a vehicle to you.`,
  locationReceived: () => `📍 Location received. Locking in your pickup request…`,
  askDropoffTiming: (branchName: string) => `No problem — when will you bring it to *${branchName}* yourself?`,
  clarifyBags: () => `Sorry, I didn't catch a bag count — try a number like "12", or tap one of the quick picks below.`,
  clarifyBranch: () => `Please pick one of the branches below so we know where to route you 🙏`,
  clarifyType: () => `Please choose one — *Team Pickup* or *Self-Drop* — using the buttons below 🙏`,
  nudgeLocationButton: () => `Tap the *📍 Share Farm Location* button below so I can route a driver to you.`,
  clarifyTiming: () => `Please pick *Today*, *Tomorrow*, or *This week* below.`,
  fallback: () => `I can help you log ackee that's ready for pickup. Tap *🌱 Ackee Ready* below to get started, or *📦 My Requests* to check on an existing one.`,
  requestConfirmed: (id: string) => `✅ Request *${id}* received! Our dispatch team will confirm your pickup window here shortly.`,
  routeScheduled: (id: string, driverName: string, dateLabel: string, bags: number) =>
    `🚚 Update on *${id}*: a pickup has been scheduled! ${driverName} will collect your ${bags} bags — ${dateLabel}.`,
  driverEnRoute: (driverName: string) => `🚛 ${driverName} is on the way to your farm now.`,
  collected: (id: string, actualBags: number, estimatedBags: number, name: string) => {
    const diff = actualBags - estimatedBags
    const note = diff === 0 ? '' : diff > 0 ? ` (${diff} more than estimated)` : ` (${Math.abs(diff)} fewer than estimated)`
    return `✅ Collected! We picked up ${actualBags} bags${note} from you today. Medaase, ${firstName(name)} 🙏`
  },
  receivedPass: (bags: number, name: string) => `🏭 Received at the Kumasi depot — quality check *passed* on all ${bags} bags. Medaase, ${firstName(name)}!`,
  qualityFlagged: (name: string) => `⚠️ Our driver flagged a quality concern with your bags at pickup. Our team will reach out about next steps, ${firstName(name)}.`,
  myRequestsEmpty: () => `You don't have any requests logged yet. Tap *🌱 Ackee Ready* to send your first one!`,
  myRequestsHeader: () => `Here's what's on file for you recently:`,
  languageChanged: () => `✅ Switched to English.`,
  todayLabel: () => 'Today',
  tomorrowLabel: () => 'Tomorrow',
  thisWeekLabel: () => 'This week',
}

const copyTw = {
  welcome: (name: string) =>
    `Akwaaba wo Tallawah Foods, ${firstName(name)} 👋\nSo *🌱 Ackee Ayɛ Krado* no sɛ wo nkotoku no ayɛ krado, anaa ka dodow a wowɔ kyerɛ me.`,
  askBags: (name: string) => `Nsɛnpa, ${firstName(name)}! 🌿 Wo ackee nkotoku dodow sɛn na ayɛ krado ɛnnɛ?`,
  bagsNoted: (bags: number) => `Makyerɛw nkotoku ${bags} ✅. Yɛn ofisi bɛn na ɛbɛn wo afuom?`,
  branchChosen: (branchName: string) => `Mate aseɛ — *${branchName}*. Ɛkwan bɛn so na yɛmfa wo nkotoku no nkɔ hɔ?`,
  askLocation: () => `Ɛyɛ — mesrɛ wo, kyerɛ yɛn faako wo afuom wɔ na yɛatumi asoma kar aba wo nkyɛn.`,
  locationReceived: () => `📍 Yɛanya wo baabi a wowɔ. Yɛde wo abisadeɛ no resi hɔ…`,
  askDropoffTiming: (branchName: string) => `Ɛnyɛ hwee — da bɛn na wode bɛba *${branchName}* wo ara wo ho?`,
  clarifyBags: () => `Kafra, mante nkotoku dodow no aseɛ — sɔ hwɛ nɔma te sɛ "12", anaa so nea ɛwɔ ase ha no baako.`,
  clarifyBranch: () => `Mesrɛ wo, paw yɛn ofisi baako a ɛwɔ ase ha na yɛahu faako a yɛde wo bɛkɔ 🙏`,
  clarifyType: () => `Mesrɛ wo, paw baako — *Yɛn Adwumayɛfo Mmegye* anaasɛ *Wo Ara Wode Bɛba* — fa button a ɛwɔ ase ha 🙏`,
  nudgeLocationButton: () => `So *📍 Kyerɛ Wo Afuom Baabi* button a ɛwɔ ase ha na matumi asoma draeva aba wo nkyɛn.`,
  clarifyTiming: () => `Mesrɛ wo, paw *Ɛnnɛ*, *Ɔkyena*, anaasɛ *Dapɛn Yi* a ɛwɔ ase ha.`,
  fallback: () => `Metumi aboa wo ama woakyerɛw ackee a ayɛ krado sɛ yɛbɛgye. So *🌱 Ackee Ayɛ Krado* na yɛahyɛ aseɛ, anaasɛ *📦 Me Abisadeɛ* na woahwɛ deɛ wowɔ dada.`,
  requestConfirmed: (id: string) => `✅ Yɛanya wo abisadeɛ *${id}*! Yɛn dispatch team bɛka mmerɛ a yɛbɛba abegye wo nkotoku no akyerɛ wo nnansa yi ara.`,
  routeScheduled: (id: string, driverName: string, dateLabel: string, bags: number) =>
    `🚚 Nsɛm foforɔ wɔ *${id}* ho: yɛahyehyɛ sɛ yɛbɛba abegye! ${driverName} bɛgye wo nkotoku ${bags} no — ${dateLabel}.`,
  driverEnRoute: (driverName: string) => `🚛 ${driverName} rekɔ wo afuom mu seesei ara.`,
  collected: (id: string, actualBags: number, estimatedBags: number, name: string) => {
    const diff = actualBags - estimatedBags
    const note = diff === 0 ? '' : diff > 0 ? ` (${diff} sen deɛ yɛkaa kan)` : ` (${Math.abs(diff)} kumaa sen deɛ yɛkaa kan)`
    return `✅ Yɛagye! Yɛfaa wo nkotoku ${actualBags}${note} ɛnnɛ. Medaase, ${firstName(name)} 🙏`
  },
  receivedPass: (bags: number, name: string) => `🏭 Yɛanya no wɔ Kumasi depot hɔ — yɛhwɛɛ na *ɛyɛ yie* wɔ nkotoku ${bags} nyinaa mu. Medaase, ${firstName(name)}!`,
  qualityFlagged: (name: string) => `⚠️ Yɛn draeva hui sɛ wo nkotoku no ho asɛm bi wɔ hɔ berɛ a ɔrebɛgye no. Yɛn team bɛfrɛ wo aka deɛ ɛdi hɔ akyerɛ wo, ${firstName(name)}.`,
  myRequestsEmpty: () => `Wonnya abisadeɛ biara a yɛakyerɛw. So *🌱 Ackee Ayɛ Krado* na woasoma deɛ edi kan!`,
  myRequestsHeader: () => `Deɛ yɛakyerɛw wɔ wo ho nnansa yi ni:`,
  languageChanged: () => `✅ Yɛasesa kɔ Twi mu.`,
  todayLabel: () => 'Ɛnnɛ',
  tomorrowLabel: () => 'Ɔkyena',
  thisWeekLabel: () => 'Dapɛn Yi',
}

export type CopySet = typeof copyEn

export function copyFor(lang?: Language): CopySet {
  return lang === 'tw' ? copyTw : copyEn
}

export function branchOptions(branches: Branch[]) {
  return branches.map((b) => ({ label: `📍 ${b.name}`, value: b.id }))
}

export function pickupTypeOptions(lang?: Language) {
  const tw = lang === 'tw'
  return [
    { label: tw ? '🚚 Yɛn Adwumayɛfo Mmegye' : '🚚 Team Pickup', value: 'staff_pickup' as RequestType },
    { label: tw ? '🏭 Me Ara Mede Bɛba' : '🏭 I’ll Self-Drop', value: 'self_drop' as RequestType },
  ]
}

export function pickupTypeLabel(type: RequestType, lang?: Language) {
  return pickupTypeOptions(lang).find((o) => o.value === type)?.label ?? type
}

// short form used in the request card, without the emoji/verb flourish of the button label
export function pickupTypeShortLabel(type: RequestType, lang?: Language) {
  const tw = lang === 'tw'
  if (type === 'staff_pickup') return tw ? 'Adwumayɛfo Mmegye' : 'Team pickup'
  return tw ? 'Wo Ara Wobɛba' : 'Self-drop'
}

const DROPOFF_TIMING_KEYS = ['today', 'tomorrow', 'this_week'] as const
export type DropoffTimingKey = (typeof DROPOFF_TIMING_KEYS)[number]

// stored on the request as a stable key, translated at display time — so a farmer who
// switches language later still sees a fully-translated card, not a frozen-language relic
export function dropoffTimingLabel(key: string, lang?: Language) {
  const t = copyFor(lang)
  if (key === 'today') return t.todayLabel()
  if (key === 'tomorrow') return t.tomorrowLabel()
  if (key === 'this_week') return t.thisWeekLabel()
  return key
}

export function dropoffTimingOptions(lang?: Language) {
  return DROPOFF_TIMING_KEYS.map((key) => ({ label: dropoffTimingLabel(key, lang), value: key }))
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

export function statusLabel(status: string, lang?: Language) {
  const tw = lang === 'tw'
  switch (status) {
    case 'unassigned':
      return tw ? 'Yɛretwɛn' : 'Pending assignment'
    case 'assigned':
      return tw ? 'Yɛahyehyɛ' : 'Pickup scheduled'
    case 'fulfilled':
      return tw ? 'Yɛagye' : 'Collected'
    case 'flagged':
      return tw ? 'Ɛho hia nhwɛso' : 'Needs attention'
    default:
      return status
  }
}

export function cardLabels(lang?: Language) {
  const tw = lang === 'tw'
  return {
    bags: tw ? 'Nkotoku' : 'Bags',
    branch: tw ? 'Ofisi' : 'Branch',
    method: tw ? 'Ɛkwan' : 'Method',
    when: tw ? 'Da' : 'When',
    status: tw ? 'Tebea' : 'Status',
  }
}

export function composerLabels(lang?: Language) {
  const tw = lang === 'tw'
  return {
    ackeeReady: tw ? 'Ackee Ayɛ Krado' : 'Ackee Ready',
    myRequests: tw ? 'Me Abisadeɛ' : 'My Requests',
    typeMessage: tw ? 'Kyerɛw nkra bi' : 'Type a message',
    shareLocation: tw ? 'Kyerɛ Wo Afuom Baabi' : 'Share Farm Location',
  }
}
