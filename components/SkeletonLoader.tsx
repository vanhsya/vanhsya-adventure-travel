import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 rounded w-3/4" style={{ backgroundColor: 'var(--border-color)' }}></div>
      <div className="h-4 rounded" style={{ backgroundColor: 'var(--border-color)' }}></div>
      <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--border-color)' }}></div>
    </div>
  );
};

export default SkeletonLoader;
