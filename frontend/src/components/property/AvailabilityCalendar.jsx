import { DayPicker } from 'react-day-picker'

function toBlockedRanges(blocks) {
  return (blocks || []).map((b) => ({
    from: new Date(`${b.start_date}T00:00:00`),
    to: new Date(`${b.end_date}T00:00:00`),
  }))
}

export default function AvailabilityCalendar({ blocks, mode, selected, onSelect }) {
  const blockedRanges = toBlockedRanges(blocks)
  const disabled = mode ? [...blockedRanges, { before: new Date(new Date().toDateString()) }] : blockedRanges

  return (
    <div>
      <DayPicker
        mode={mode}
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        numberOfMonths={1}
        showOutsideDays
      />
      <div className="d-flex align-items-center gap-2 small text-muted mt-2">
        <span
          className="d-inline-block rounded-1"
          style={{ width: 12, height: 12, backgroundColor: '#fbe3e2', border: '1px solid #b13a34' }}
        />
        Unavailable
      </div>
    </div>
  )
}
