import { useState } from "react";
import { reviewsApi } from "../../services/api";
import ErrorAlert from "../common/ErrorAlert";
import { Star, Send } from "lucide-react";

export default function ReviewForm({ booking, onCreated }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const review = await reviewsApi.create({
        booking_id: booking.id,
        rating: Number(rating),
        comment: comment.trim() || null,
      });
      onCreated(review);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 pt-4 border-t border-slate-800 space-y-3">
      <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        <span>Add a review</span>
      </div>

      <ErrorAlert error={error} />

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="w-full sm:w-32">
          <label className="block text-xs text-slate-400 mb-1">Rating</label>
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value} className="bg-slate-900 text-white">
                {value} / 5 Stars
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs text-slate-400 mb-1">Comment</label>
          <input
            type="text"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Share your experience"
            maxLength={2000}
            className="w-full px-3 py-2 text-sm rounded-xl bg-slate-950/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 shadow-md shadow-pink-500/25 disabled:opacity-50 transition-all shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{saving ? "Saving..." : "Submit"}</span>
        </button>
      </div>
    </form>
  );
}
