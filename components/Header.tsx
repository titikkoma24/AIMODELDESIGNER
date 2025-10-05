import React from 'react';
import { SparklesIcon, ClockIcon } from './icons';

interface HeaderProps {
  remainingTime: number;
}

const Header: React.FC<HeaderProps> = ({ remainingTime }) => {

  const formattedTime = remainingTime === -1
    ? 'Unlimited'
    : `${String(Math.floor(remainingTime / 60)).padStart(2, '0')}:${String(remainingTime % 60).padStart(2, '0')}`;
  
  const timeText = remainingTime === -1 ? 'Waktu: ' : 'Sisa Waktu: ';

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-cyan-400" />
          <div className="flex items-baseline gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                AI Model Designer <span className="text-cyan-400">Studio</span>
              </h1>
              <a 
                href="https://www.threads.com/@zakiromdoni" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-cyan-400 transition-colors duration-200"
              >
                by zakiromdoni
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-yellow-400 font-mono" aria-live="polite">
          <ClockIcon className="w-5 h-5" />
          <span>{timeText}{formattedTime}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;