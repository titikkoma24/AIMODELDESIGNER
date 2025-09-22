
import React from 'react';
import { SparklesIcon } from './icons';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AI Model Designer <span className="text-cyan-400">Studio</span>
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
