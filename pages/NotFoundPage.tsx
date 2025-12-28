import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] py-20">
      <div className="text-center">
        <h1 className="text-9xl font-black text-gray-800">404</h1>
        <p className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
          Uh-oh! Page Lost in Cyberspace.
        </p>
        <p className="mt-4 text-gray-400">We can't find the page you're looking for.</p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-transform transform hover:scale-105"
        >
          Return to Home Base
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;