import { useState } from 'react'
import iv from './invite.module.css'
import { useTallawahStore } from '../../../store/useStore'
import { FARM_COMMUNITIES } from '../../../lib/geo'
import { Button } from '../../../components/ui/Button'
import { FieldGroup, Input, Select } from '../../../components/ui/Field'
import { Sheet } from '../../../components/ui/Sheet'
import { useToast } from '../../../components/ui/Toast'
import { Send, X } from '../../../components/icons'

const COMMUNITIES = FARM_COMMUNITIES.map((c) => c.community).sort()

export function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sendInvite = useTallawahStore((st) => st.sendInvite)
  const { push } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [community, setCommunity] = useState(COMMUNITIES[0] ?? '')
  const [sent, setSent] = useState(false)

  function reset() {
    setName('')
    setPhone('')
    setCommunity(COMMUNITIES[0] ?? '')
    setSent(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function handleSend() {
    if (!name.trim() || !phone.trim()) return
    sendInvite(name.trim(), phone.trim(), community)
    setSent(true)
    push({ title: 'Invite sent', body: `${name.trim()} · ${phone.trim()}`, kind: 'request' })
    setTimeout(handleClose, 1600)
  }

  const smsPreview = name.trim()
    ? `Hi ${name.trim().split(' ')[0]}! Tallawah Foods Ghana invites you to join our ackee pickup service. Tap to get started: https://tallawah.app/join?ref=invite&token=…`
    : 'Fill in a name above to preview the invite SMS.'

  return (
    <Sheet open={open} onClose={handleClose} title="Invite a new farmer">
      {sent ? (
        <div className={iv.sentState}>
          <div className={iv.sentIcon}>
            <Send size={28} />
          </div>
          <div className={iv.sentTitle}>Invite sent!</div>
          <div className={iv.sentDesc}>
            {name} will receive an SMS with a link to join the Tallawah platform.
          </div>
        </div>
      ) : (
        <div className={iv.form}>
          <div className={iv.intro}>
            Send a personalised SMS invitation. Once the farmer taps the link and completes
            the short onboarding flow, they will appear in the directory automatically.
          </div>

          <div className={iv.fields}>
            <FieldGroup label="Full name" hint="As it will appear in the directory">
              <Input
                id="invite-name"
                placeholder="e.g. Kweku Boateng"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </FieldGroup>

            <FieldGroup label="Phone number" hint="WhatsApp-registered number">
              <Input
                id="invite-phone"
                placeholder="+233 24 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
              />
            </FieldGroup>

            <FieldGroup label="Community" hint="Their farming community">
              <Select
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
              >
                {COMMUNITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </FieldGroup>
          </div>

          <div className={iv.preview}>
            <div className={iv.previewLabel}>
              SMS preview
            </div>
            <div className={iv.previewBubble}>{smsPreview}</div>
          </div>

          <div className={iv.actions}>
            <Button variant="ghost" onClick={handleClose} icon={<X size={14} />}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!name.trim() || !phone.trim()}
              onClick={handleSend}
              icon={<Send size={14} />}
            >
              Send invite
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
