import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);


const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg flex flex-col items-center text-center">
        <div className="flex items-center mb-3">
             <ErrorIcon />
            <p className="font-semibold">Request Failed</p>
        </div>
      <p className="text-sm mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-500/50 text-white font-semibold rounded-lg hover:bg-red-500/70 transition-colors text-sm"
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorDisplay;
