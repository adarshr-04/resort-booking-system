import { useState, useEffect } from 'react'
import { Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { api, type Review } from '@/lib/api'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface RoomReviewsProps {
  roomId: number
  roomName: string
  completedBookingId?: number // If passed, shows the submit form
}

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={cn("transition-all", readonly ? "cursor-default" : "cursor-pointer hover:scale-110")}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              (hovered || value) >= star ? "fill-amber-400 text-amber-400" : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function RoomReviews({ roomId, roomName, completedBookingId }: RoomReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchReviews = async () => {
    try {
      const data = await api.getRoomReviews(roomId)
      setReviews(data)
    } catch {
      // no-op
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [roomId])

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setErrorMsg('Please select a star rating.'); return }
    if (!comment.trim()) { setErrorMsg('Please write a short comment.'); return }
    setSubmitting(true)
    setErrorMsg('')
    try {
      await api.createReview({ room: roomId, rating, comment })
      setSubmitStatus('success')
      setRating(0)
      setComment('')
      await fetchReviews()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit review.')
      setSubmitStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* Summary Bar */}
      {!loading && reviews.length > 0 && (
        <div className="flex items-center gap-6 p-6 bg-accent/5 border border-accent/10">
          <div className="text-center">
            <div className="text-4xl font-serif italic text-charcoal">{avgRating.toFixed(1)}</div>
            <StarRating value={Math.round(avgRating)} readonly />
            <p className="text-[9px] tracking-widest uppercase text-muted-foreground mt-1">{reviews.length} Reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {[5,4,3,2,1].map(s => {
              const count = reviews.filter(r => r.rating === s).length
              const pct = reviews.length ? (count / reviews.length) * 100 : 0
              return (
                <div key={s} className="flex items-center gap-2">
                  <span className="text-[9px] w-2 text-muted-foreground">{s}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                  <div className="flex-1 h-1.5 bg-accent/10 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[9px] text-muted-foreground w-4">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit Form (only if guest had a completed booking) */}
      {completedBookingId && (
        <div className="border border-accent/10 p-8 bg-white/60">
          <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-accent mb-6">Share Your Experience</h4>
          {submitStatus === 'success' ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Thank you for your review! It has been published.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold block mb-2">Your Rating</label>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold block mb-2">Your Review</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Tell us about your stay at the resort..."
                  rows={4}
                  className="w-full bg-[#FAFAFA] border border-accent/10 p-4 text-xs italic focus:outline-none focus:border-accent transition-all resize-none"
                />
              </div>
              {errorMsg && (
                <div className="flex items-center gap-2 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent text-white py-4 text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-accent/40" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-xs italic text-muted-foreground text-center py-8">
          No reviews yet for {roomName}. Be the first to share your experience!
        </p>
      ) : (
        <div className="space-y-6">
          <h4 className="text-[11px] uppercase tracking-[0.3em] font-bold text-muted-foreground">Guest Reviews</h4>
          {reviews.map(review => (
            <div key={review.id} className="bg-white/60 border border-accent/5 p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">{review.user_name}</p>
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground">
                    {format(new Date(review.created_at), 'MMMM yyyy')}
                  </p>
                </div>
                <StarRating value={review.rating} readonly />
              </div>
              <p className="text-xs italic text-muted-foreground leading-relaxed">"{review.comment}"</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
