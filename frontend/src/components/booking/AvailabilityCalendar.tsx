import { useState, useEffect } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { format, isWithinInterval, parseISO, isBefore, startOfToday } from 'date-fns'
import { cn } from '@/lib/utils'
import 'react-day-picker/dist/style.css'

interface AvailabilityCalendarProps {
  bookedRanges: { check_in: string; check_out: string }[]
  selectedRange: DateRange | undefined
  onRangeSelect: (range: DateRange | undefined) => void
  onDateError: (error: string | null) => void
}

export function AvailabilityCalendar({ 
  bookedRanges, 
  selectedRange, 
  onRangeSelect,
  onDateError
}: AvailabilityCalendarProps) {
  
  // Convert backend strings to date objects
  const disabledDays = bookedRanges.map(range => ({
    from: parseISO(range.check_in),
    to: parseISO(range.check_out)
  }))

  // Prevent selecting dates in the past
  const pastDays = { before: startOfToday() }
  const allDisabled = [pastDays, ...disabledDays]

  const handleSelect = (range: DateRange | undefined) => {
    onDateError(null)

    // Check if the selected range spans across an already booked date
    if (range?.from && range?.to) {
      const hasConflict = bookedRanges.some(booked => {
        const bookedIn = parseISO(booked.check_in)
        const bookedOut = parseISO(booked.check_out)
        
        // Return true if any part of the booked range is WITHIN the selected range
        // Note: We allow checkout/checkin on same day (Hotel standard)
        return (
          isWithinInterval(bookedIn, { start: range.from!, end: range.to! }) &&
          !isBefore(bookedIn, range.from!) && // Not starting on same day check-in
          isBefore(bookedIn, range.to!)      // But starting before check-out
        )
      })

      if (hasConflict) {
        onDateError("One or more dates in this range are already booked. Please try a different period.")
        onRangeSelect(undefined)
        return
      }
    }
    
    onRangeSelect(range)
  }

  return (
    <div className="bg-transparent p-0 mx-auto lg:mx-0">
      <style>{`
        .luxury-calendar {
          background: transparent;
          font-family: inherit;
        }
        .rdp {
          --rdp-cell-size: 44px;
          --rdp-accent-color: #8B1A10; /* Deep Burgundy for accents */
          --rdp-background-color: #F7E7E7; /* Light Rose for range select */
          margin: 0;
        }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          background-color: var(--rdp-accent-color);
          color: white;
          border-radius: 2px;
        }
        .rdp-day_range_middle {
          background-color: var(--rdp-background-color) !important;
          color: var(--rdp-accent-color) !important;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #FDECEC;
        }
        .rdp-day_disabled {
          text-decoration: line-through;
          opacity: 0.2;
          cursor: not-allowed;
        }
        .rdp-head_cell {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #4A4A4A;
        }
        .rdp-month_caption {
          font-family: serif;
          font-size: 18px;
          font-style: italic;
          color: #2D2D2D;
          border-bottom: 1px solid #E8E8E8;
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }
      `}</style>
      <DayPicker
        mode="range"
        selected={selectedRange}
        onSelect={handleSelect}
        disabled={allDisabled}
        numberOfMonths={1}
        className="luxury-calendar"
        footer={
          <div className="mt-8 flex flex-wrap justify-between gap-4 text-[9px] tracking-[0.2em] uppercase text-muted-foreground font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#8B1A10]"></div>
              <span>Active Selection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted opacity-50 line-through"></div>
              <span>Sold Out</span>
            </div>
          </div>
        }
      />
    </div>
  )
}
