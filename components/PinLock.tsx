
import React, { useState } from 'react';
import { LockIcon } from './icons';

interface PinLockProps {
  onUnlock: (isUnlimited: boolean) => void;
}

const LIMITED_PIN = '91';
const UNLIMITED_PIN = '24';

const PinLock: React.FC<PinLockProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setPin(value);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === LIMITED_PIN) {
      onUnlock(false);
    } else if (pin === UNLIMITED_PIN) {
      onUnlock(true);
    }
    else {
      setError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="w-full max-w-sm p-8 space-y-6 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl">
        <div className="text-center">
          <LockIcon className="w-12 h-12 mx-auto text-cyan-400" />
          <h2 className="mt-4 text-2xl font-bold text-white">Enter Access PIN</h2>
          <p className="mt-2 text-sm text-gray-400">Please enter the PIN to access the AI menu.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pin" className="sr-only">PIN</label>
            <input
              id="pin"
              name="pin"
              type="password"
              autoComplete="off"
              required
              value={pin}
              onChange={handlePinChange}
              maxLength={4}
              className="w-full px-3 py-3 text-lg text-center text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 tracking-[1em]"
              placeholder="••••"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-cyan-400 hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
              disabled={!pin}
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinLock;
