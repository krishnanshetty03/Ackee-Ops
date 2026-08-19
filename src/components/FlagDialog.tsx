import { useState } from 'react'
import type { ExceptionType } from '../lib/types'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'
import { FieldGroup, RadioCards, Textarea } from './ui/Field'
import { AlertTriangle } from './icons'

const TYPE_OPTIONS: { value: ExceptionType; title: string; desc: string }[] = [
  { value: 'farmer_not_ready', title: 'Farmer not ready', desc: 'Bags aren’t ready yet' },
  { value: 'rescheduled', title: 'Reschedule', desc: 'Move to a different date' },
  { value: 'other', title: 'Other', desc: 'Anything else' },
]

export function FlagDialog({
  open,
  onClose,
  onSubmit,
  subjectLabel,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (input: { type: ExceptionType; note: string; rescheduledDate?: string }) => void
  subjectLabel: string
}) {
  const [type, setType] = useState<ExceptionType>('farmer_not_ready')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')

  function submit() {
    onSubmit({ type, note: note.trim() || TYPE_OPTIONS.find((t) => t.value === type)?.desc || '', rescheduledDate: type === 'rescheduled' ? date : undefined })
    setNote('')
    setDate('')
    setType('farmer_not_ready')
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Flag an exception"
      subtitle={subjectLabel}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon={<AlertTriangle size={15} />} onClick={submit}>
            Flag it
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FieldGroup label="What's going on?">
          <RadioCards options={TYPE_OPTIONS} value={type} onChange={setType} />
        </FieldGroup>
        {type === 'rescheduled' && (
          <FieldGroup label="New date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: '100%', border: '1px solid var(--border-strong)', background: 'var(--surface)', borderRadius: 'var(--r-sm)', padding: '9px 11px', fontSize: 13, color: 'var(--text)' }}
            />
          </FieldGroup>
        )}
        <FieldGroup label="Note" hint="Shown to the team, kept with this record">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should the team know?" />
        </FieldGroup>
      </div>
    </Sheet>
  )
}
