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
    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center">
      <DayPicker
        mode={mode}
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        numberOfMonths={1}
        showOutsideDays
      />
      <div className="flex items-center gap-2 text-xs text-slate-400 mt-3 self-start">
        <span className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
        <span>Unavailable dates</span>
      </div>
    </div>
  )
}
