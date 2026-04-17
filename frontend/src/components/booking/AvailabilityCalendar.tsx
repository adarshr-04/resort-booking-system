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
    <div className="bg-background border border-border p-4 shadow-sm w-fit mx-auto lg:mx-0">
      <style>{`
        .rdp {
          --rdp-cell-size: 40px;
          --rdp-accent-color: #1A3C34;
          --rdp-background-color: #E8F0EE;
          margin: 0;
        }
        .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
          background-color: var(--rdp-accent-color);
          color: white;
        }
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: #F8F5F0;
        }
        .rdp-day_disabled {
          text-decoration: line-through;
          opacity: 0.3;
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
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-[10px] tracking-widest uppercase text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted opacity-30 line-through"></div>
              <span>Sold Out</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full border border-border"></div>
              <span>Available</span>
            </div>
          </div>
        }
      />
    </div>
  )
}
