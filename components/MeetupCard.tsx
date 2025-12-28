
import React from 'react';
import { Link } from 'react-router-dom';
import { Meetup } from '../types';

interface MeetupCardProps {
  meetup: Meetup;
}

const MeetupCard: React.FC<MeetupCardProps> = ({ meetup }) => {
  const spotsLeft = meetup.capacity - meetup.attendees;
  const progressPercentage = (meetup.attendees / meetup.capacity) * 100;

  return (
    <div 
      className="rounded-xl overflow-hidden shadow-lg flex flex-col transform border transition-all duration-300 hover:-translate-y-1 group"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        '--shadow-color-var': 'var(--shadow-color-secondary)'
      } as React.CSSProperties}
      onMouseOver={e => {
          e.currentTarget.style.boxShadow = `0 6px 20px -3px var(--shadow-color-var)`;
          e.currentTarget.style.borderColor = 'var(--accent-secondary)';
      }}
      onMouseOut={e => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
    >
      <div className="relative">
        <div 
          className="h-48 bg-cover bg-center" 
          style={{ backgroundImage: `url(${meetup.imageUrl})` }}
          aria-label={meetup.title}
        ></div>
        <div className="absolute top-2 right-2 flex items-center bg-black/60 backdrop-blur-sm p-2 rounded-lg">
            <img src={meetup.host.avatarUrl} alt={meetup.host.name} className="w-8 h-8 rounded-full border-2 border-white/50 object-cover" />
            <div className="ml-2 text-xs text-white">
                <p className="font-semibold leading-tight">Hosted by</p>
                <p className="leading-tight">{meetup.host.name}</p>
            </div>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-primary)'}}>
            {meetup.city}, {meetup.country}
        </p>
        <h3 className="font-bold text-lg mt-1" style={{ color: 'var(--text-primary)'}}>{meetup.title}</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)'}}>{meetup.date} &bull; {meetup.time}</p>
        
        <div className="mt-4 flex-grow">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                    className="h-2.5 rounded-full" 
                    style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--accent-secondary)' }}
                ></div>
            </div>
            <p className="text-xs text-right mt-1" style={{ color: 'var(--text-secondary)'}}>
                {spotsLeft > 0 ? `${spotsLeft} spots left!` : 'Event Full!'}
            </p>
        </div>

        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)'}}>
          <button 
            disabled={spotsLeft <= 0}
            className="w-full px-4 py-2 rounded-md text-white text-sm font-semibold transition-colors transform hover:scale-105 shadow-md disabled:bg-gray-600 disabled:cursor-not-allowed" 
            style={{ 
              backgroundColor: 'var(--accent-primary)',
              boxShadow: '0 4px 6px -1px var(--shadow-color-primary), 0 2px 4px -1px var(--shadow-color-primary)'
            }}
          >
            {spotsLeft > 0 ? 'View Details' : 'Full'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetupCard;
