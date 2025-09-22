import React, { useState } from 'react';
import Header from './components/Header';
import PinLock from './components/PinLock';
import ModelCreator from './components/ModelCreator';
import ClothingIdentifier from './components/ClothingIdentifier';
import PoseChanger from './components/PoseChanger';
import PoseDetector from './components/PoseDetector';
import ImageToPromptConverter from './components/ImageToPromptConverter';
import NanoBananaEditor from './components/NanoBanana';
import HairChanger from './components/HairChanger';
import { TshirtIcon, SparklesIcon as CustomizeIcon, PoseIcon, AnatomyIcon, MagnifyingGlassOnDocumentIcon, PencilIcon, ScissorsIcon } from './components/icons';


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'model' | 'clothing' | 'pose' | 'pose-detection' | 'image-to-prompt' | 'nano-banana' | 'hair'>('model');

  const handleUnlock = () => {
    setIsAuthenticated(true);
  };

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
      <Header />
      <main className="container mx-auto p-4 lg:p-8">
        <div className="mb-8 flex justify-center gap-2 md:gap-4 flex-wrap">
          <TabButton isActive={activeTab === 'model'} onClick={() => setActiveTab('model')}>
            <CustomizeIcon className="w-5 h-5" />
            Model Creation
          </TabButton>
          <TabButton isActive={activeTab === 'clothing'} onClick={() => setActiveTab('clothing')}>
            <TshirtIcon className="w-5 h-5" />
            Clothing ID
          </TabButton>
          <TabButton isActive={activeTab === 'pose'} onClick={() => setActiveTab('pose')}>
            <PoseIcon className="w-5 h-5" />
            Change Pose
          </TabButton>
           <TabButton isActive={activeTab === 'pose-detection'} onClick={() => setActiveTab('pose-detection')}>
            <AnatomyIcon className="w-5 h-5" />
            Pose Detection
          </TabButton>
          <TabButton isActive={activeTab === 'image-to-prompt'} onClick={() => setActiveTab('image-to-prompt')}>
            <MagnifyingGlassOnDocumentIcon className="w-5 h-5" />
            Image to Prompt
          </TabButton>
          <TabButton isActive={activeTab === 'nano-banana'} onClick={() => setActiveTab('nano-banana')}>
            <PencilIcon className="w-5 h-5" />
            Nano Banana
          </TabButton>
          <TabButton isActive={activeTab === 'hair'} onClick={() => setActiveTab('hair')}>
            <ScissorsIcon className="w-5 h-5" />
            Ganti Rambut
          </TabButton>
        </div>

        {activeTab === 'model' && <ModelCreator />}
        {activeTab === 'clothing' && <ClothingIdentifier />}
        {activeTab === 'pose' && <PoseChanger />}
        {activeTab === 'pose-detection' && <PoseDetector />}
        {activeTab === 'image-to-prompt' && <ImageToPromptConverter />}
        {activeTab === 'nano-banana' && <NanoBananaEditor />}
        {activeTab === 'hair' && <HairChanger />}

      </main>
    </div>
  );
};

export default App;