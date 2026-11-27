import React from 'react';
import { Link } from 'react-router-dom';
import { SocialEvent } from '../types';

interface MeetupCardProps {
  event: SocialEvent;
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  upcoming: {
    label: 'Verified · Upcoming',
    className: 'text-purple-200 border-purple-400/40 bg-purple-950/60',
  },
  sold_out: {
    label: 'Sold Out',
    className: 'text-amber-200 border-amber-400/40 bg-amber-950/60',
  },
  completed: {
    label: 'Completed',
    className: 'text-emerald-200 border-emerald-400/40 bg-emerald-950/60',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'text-rose-200 border-rose-400/40 bg-rose-950/60',
  },
};

const MeetupCard: React.FC<MeetupCardProps> = ({ event }) => {
  const attendeesCount = event.attendeesCount || 0;
  const spotsLeft = Math.max(0, event.capacity - attendeesCount);
  const progressPercentage = event.capacity > 0 ? Math.min(100, (attendeesCount / event.capacity) * 100) : 0;
  const statusInfo = STATUS_STYLES[event.status] || STATUS_STYLES.upcoming;

  return (
    <article className="rounded-2xl overflow-hidden flex flex-col border border-purple-500/20 bg-[#120F1D] transition-all duration-300 hover:-translate-y-1 hover:border-purple-400/50 shadow-xl">
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#1C1430] to-[#0D0A16]">
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-purple-950/70 via-[#150E26] to-[#0B0812]">
            <span className="text-xs uppercase tracking-[0.25em] text-purple-300 font-semibold">
              Vanhsya Social Club
            </span>
            <p className="text-lg font-cinzel font-bold text-white mt-2">{event.emirate}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120F1D] via-transparent to-black/30" />
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-gray-200">
          <span className="font-medium">
            {event.city}, {event.emirate}
          </span>
          <span className="text-purple-200 font-medium">{event.ageRestriction}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <p className="text-xs text-purple-300 font-semibold tracking-wide">
          {event.category} · {event.eventDate} · {event.startTime}
        </p>

        <h3 className="font-bold text-lg text-white font-cinzel mt-1.5 leading-snug">
          {event.title}
        </h3>

        <p className="text-xs text-gray-400 mt-1">
          {event.venueName}
          {event.hostName ? ` · Host: ${event.hostName}` : ''}
        </p>

        <p className="text-sm text-gray-300 mt-3 line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-gray-300 mb-1.5">
            <span>
              {attendeesCount} / {event.capacity} seats reserved
            </span>
            <span className="font-semibold text-purple-300">
              {event.status === 'cancelled'
                ? 'Cancelled'
                : event.status === 'completed'
                ? 'Event Concluded'
                : spotsLeft > 0
                ? `${spotsLeft} spots open`
                : 'Sold Out'}
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-violet-300 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-5">
          <Link
            to={`/meetups/${event.slug}`}
            className="block w-full text-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors"
          >
            {event.status === 'upcoming' && spotsLeft > 0
              ? 'View Details & RSVP'
              : event.status === 'completed'
              ? 'View Event & Share Feedback'
              : 'View Event Details'}
          </Link>
        </div>
      </div>
    </article>
  );
};

export default MeetupCard;
