import React, { useState } from 'react';
import { Booking, TripReview } from '../types';
import { useAppContext } from '../contexts/AppContext';

interface TripFeedbackProps {
  bookingToReview?: Booking | null;
  onClose?: () => void;
  isOpen?: boolean;
}

const HIGHLIGHT_TAGS = [
  'Breathtaking Views',
  'Expert Local Guide',
  'Hidden Gems',
  'Solo-Travel Friendly',
  'Well Organized',
  'Seamless Transit',
  'Cultural Depth',
  'Great Value',
];

export const TripFeedbackModal: React.FC<TripFeedbackProps> = ({
  bookingToReview,
  onClose,
  isOpen = true,
}) => {
  const { bookings, reviews, addReview } = useAppContext();
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  const [selectedBookingId, setSelectedBookingId] = useState<string>(
    bookingToReview ? bookingToReview.id : completedBookings[0]?.id || ''
  );

  const activeBooking = bookings.find((b) => b.id === selectedBookingId) || bookingToReview || completedBookings[0];
  const existingReview = reviews.find((r) => r.bookingId === activeBooking?.id);

  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [guideRating, setGuideRating] = useState<number>(existingReview?.guideRating || 5);
  const [sustainabilityRating, setSustainabilityRating] = useState<number>(
    existingReview?.sustainabilityRating || 5
  );
  const [valueRating, setValueRating] = useState<number>(existingReview?.valueRating || 5);
  const [title, setTitle] = useState<string>(existingReview?.title || '');
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [authorName, setAuthorName] = useState<string>(existingReview?.authorName || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    existingReview?.tags || ['Solo-Travel Friendly']
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBooking) return;
    if (!title.trim() || !comment.trim() || !authorName.trim()) {
      setFormError('Please provide your name, headline, and review details.');
      return;
    }

    const newReview: TripReview = {
      id: existingReview ? existingReview.id : `REV-${Date.now().toString().slice(-5)}`,
      bookingId: activeBooking.id,
      tourId: activeBooking.tourId,
      tourTitle: activeBooking.tourTitle,
      tourSlug: activeBooking.tourSlug,
      rating,
      guideRating,
      sustainabilityRating,
      valueRating,
      title: title.trim(),
      comment: comment.trim(),
      authorName: authorName.trim(),
      date: new Date().toLocaleDateString('en-AE', { month: 'short', day: 'numeric', year: 'numeric' }),
      tags: selectedTags.length > 0 ? selectedTags : ['Verified Trip'],
    };

    addReview(newReview);
    setSubmittedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-2xl my-8 rounded-2xl border p-6 md:p-8 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
            aria-label="Close review dialog"
          >
            ✕
          </button>
        )}

        {submittedSuccess ? (
          <div className="text-center py-8 space-y-4">
            <h3 className="text-2xl font-bold font-cinzel text-white">Trip Feedback Saved</h3>
            <p className="text-sm text-gray-300">
              Thank you for sharing your authentic feedback about {activeBooking?.tourTitle}.
            </p>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                Done
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <h2 className="text-2xl font-cinzel font-bold text-white">Submit Trip Feedback</h2>
            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-200">
                {formError}
              </div>
            )}

            {completedBookings.length > 0 ? (
              <div className="space-y-2">
                {completedBookings.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBookingId(b.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left ${
                      selectedBookingId === b.id
                        ? 'border-purple-400 bg-purple-950/40'
                        : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <span className="font-bold text-white">{b.tourTitle}</span>
                    <span className="text-gray-400">{b.date}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">Complete a booked trip to attach a verified booking review.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 mb-1">Overall Rating (1-5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Headline *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-1">Review Notes *</label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/15 text-white"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {HIGHLIGHT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-lg border ${
                    selectedTags.includes(tag)
                      ? 'border-purple-400 bg-purple-600/30 text-white'
                      : 'border-white/10 text-gray-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {onClose && (
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-white/15 text-gray-300">
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!activeBooking}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold disabled:opacity-50"
              >
                Save Review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const TripFeedbackSection: React.FC = () => {
  const { reviews, bookings, deleteReview } = useAppContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-cinzel font-bold text-white">Your Personal Trip Reviews</h2>
          <p className="text-xs text-gray-400 mt-1">
            Personal notes saved locally for your completed tours. For Social Club meetups, use Post-Event Surveys.
          </p>
        </div>
        {completedBookings.length > 0 && (
          <button
            onClick={() => {
              setSelectedBooking(completedBookings[0]);
              setModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
          >
            + Add Trip Review
          </button>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="p-8 rounded-2xl border border-dashed border-white/15 text-center text-sm text-gray-400">
          No completed journey reviews saved yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-5 rounded-2xl bg-[#130E20] border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{review.title}</h3>
                <button
                  onClick={() => deleteReview(review.id)}
                  className="text-xs text-gray-400 hover:text-rose-300"
                >
                  Delete
                </button>
              </div>
              <p className="text-xs text-purple-300">
                {review.tourTitle} · Rating {review.rating}/5 · {review.date}
              </p>
              <p className="text-sm text-gray-300">{review.comment}</p>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <TripFeedbackModal
          isOpen={modalOpen}
          bookingToReview={selectedBooking}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default TripFeedbackSection;
