import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PinLock from './components/PinLock';
import ModelCreator from './components/ModelCreator';
import ClothingIdentifier from './components/ClothingIdentifier';
import PoseChanger from './components/PoseChanger';
import PoseDetector from './components/PoseDetector';
import HairChanger from './components/HairChanger';
import BackgroundChanger from './components/BackgroundChanger';
import NanoBananaEditor from './components/NanoBanana';
import VideoGenerator from './components/VideoGenerator';
import PromptKece from './components/PromptKece';
import HackedPrompt from './components/HackedPrompt';
import AestheticProductShot from './components/AestheticProductShot';
import { TshirtIcon, SparklesIcon as CustomizeIcon, PoseIcon, AnatomyIcon, ScissorsIcon, PhotoIcon, PencilIcon, VideoIcon, WandIcon, MagnifyingGlassOnDocumentIcon, ShoppingBagIcon } from './components/icons';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isUnlimitedSession, setIsUnlimitedSession] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'model' | 'clothing' | 'pose' | 'pose-detection' | 'hair' | 'background' | 'nano-banana' | 'video' | 'prompt-kece' | 'hacked-prompt' | 'aesthetic-product'>('model');
  const [remainingTime, setRemainingTime] = useState<number>(0);
  
  const handleUnlock = (isUnlimited: boolean) => {
    setIsAuthenticated(true);
    setIsUnlimitedSession(isUnlimited);
  };

  useEffect(() => {
    let timer: number;

    if (isAuthenticated && !isUnlimitedSession) {
      const SEVEN_MINUTES_IN_MS = 7 * 60 * 1000;
      const endTime = Date.now() + SEVEN_MINUTES_IN_MS;

      const updateRemainingTime = () => {
        const remainingMs = endTime - Date.now();
        
        if (remainingMs <= 0) {
          setRemainingTime(0);
          setIsAuthenticated(false);
          setIsUnlimitedSession(false);
          // Cleanup will clear the interval
        } else {
          setRemainingTime(Math.ceil(remainingMs / 1000));
        }
      };
      
      updateRemainingTime(); // Initial update
      timer = window.setInterval(updateRemainingTime, 500); // Check more frequently for accuracy
    } else if (isAuthenticated && isUnlimitedSession) {
        setRemainingTime(-1); // Unlimited
    }

    return () => {
      if (timer) {
        window.clearInterval(timer);
      }
    };
  }, [isAuthenticated, isUnlimitedSession]);

  if (!isAuthenticated) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  const TabButton: React.FC<{ isActive: boolean, onClick: () => void, children: React.ReactNode }> = ({ isActive, onClick, children }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header remainingTime={remainingTime} />
      <main className="container mx-auto p-4 lg:p-8">
        <div className="mb-8 flex justify-center gap-2 md:gap-4 flex-wrap">
          <TabButton isActive={activeTab === 'model'} onClick={() => setActiveTab('model')}>
            <CustomizeIcon className="w-5 h-5" />
            1. Model Creator
          </TabButton>
          <TabButton isActive={activeTab === 'clothing'} onClick={() => setActiveTab('clothing')}>
            <TshirtIcon className="w-5 h-5" />
            2. Clothing ID
          </TabButton>
          <TabButton isActive={activeTab === 'pose'} onClick={() => setActiveTab('pose')}>
            <PoseIcon className="w-5 h-5" />
            3. Pose Changer
          </TabButton>
           <TabButton isActive={activeTab === 'pose-detection'} onClick={() => setActiveTab('pose-detection')}>
            <AnatomyIcon className="w-5 h-5" />
            4. Pose Detector
          </TabButton>
          <TabButton isActive={activeTab === 'hair'} onClick={() => setActiveTab('hair')}>
            <ScissorsIcon className="w-5 h-5" />
            5. Hair Changer
          </TabButton>
          <TabButton isActive={activeTab === 'background'} onClick={() => setActiveTab('background')}>
            <PhotoIcon className="w-5 h-5" />
            6. Background Changer
          </TabButton>
           <TabButton isActive={activeTab === 'nano-banana'} onClick={() => setActiveTab('nano-banana')}>
            <PencilIcon className="w-5 h-5" />
            7. Nano Banana
          </TabButton>
           <TabButton isActive={activeTab === 'video'} onClick={() => setActiveTab('video')}>
            <VideoIcon className="w-5 h-5" />
            8. Prompt to Video
          </TabButton>
          <TabButton isActive={activeTab === 'prompt-kece'} onClick={() => setActiveTab('prompt-kece')}>
            <WandIcon className="w-5 h-5" />
            9. Prompt Kece
          </TabButton>
           <TabButton isActive={activeTab === 'hacked-prompt'} onClick={() => setActiveTab('hacked-prompt')}>
            <MagnifyingGlassOnDocumentIcon className="w-5 h-5" />
            10. Hacked Prompt
          </TabButton>
           <TabButton isActive={activeTab === 'aesthetic-product'} onClick={() => setActiveTab('aesthetic-product')}>
            <ShoppingBagIcon className="w-5 h-5" />
            11. Produk Aestetik
          </TabButton>
        </div>

        {activeTab === 'model' && <ModelCreator />}
        {activeTab === 'clothing' && <ClothingIdentifier />}
        {activeTab === 'pose' && <PoseChanger />}
        {activeTab === 'pose-detection' && <PoseDetector />}
        {activeTab === 'hair' && <HairChanger />}
        {activeTab === 'background' && <BackgroundChanger />}
        {activeTab === 'nano-banana' && <NanoBananaEditor />}
        {activeTab === 'video' && <VideoGenerator />}
        {activeTab === 'prompt-kece' && <PromptKece />}
        {activeTab === 'hacked-prompt' && <HackedPrompt />}
        {activeTab === 'aesthetic-product' && <AestheticProductShot />}

      </main>
    </div>
  );
};

export default App;