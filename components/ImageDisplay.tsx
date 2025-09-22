import React from 'react';
import Spinner from './Spinner';
import { DownloadIcon, RegenerateIcon, SparklesIcon, XMarkIcon } from './icons';
import ImageZoom from './ImageZoom';

interface ImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onImproveSharpness?: () => void;
  isImprovingSharpness?: boolean;
  isStandalone?: boolean;
  title?: string;
  error?: string | null;
}

const ActionButton: React.FC<{
  onClick?: () => void;
  href?: string;
  download?: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, href, download, disabled, children }) => {
  const commonClasses = "flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const enabledClasses = "bg-gray-700 text-gray-200 hover:bg-gray-600";

  if (href) {
    return (
      <a href={href} download={download} className={`${commonClasses} ${enabledClasses}`}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={`${commonClasses} ${enabledClasses}`}>
      {children}
    </button>
  );
};

const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, isLoading, onRegenerate, onImproveSharpness, isImprovingSharpness, isStandalone = false, title = "Generated Model", error }) => {
  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-semibold text-cyan-400 mb-4">{title}</h3>
      <div className="flex-grow flex items-center justify-center bg-gray-900/50 rounded-lg overflow-hidden p-4 min-h-[300px]">
        {isLoading && (
          <div className="text-center">
            <Spinner />
            <p className="mt-3 text-gray-400">Generating your model... this may take a moment.</p>
          </div>
        )}
        {!isLoading && error && (
            <div className="text-center text-red-400 p-4">
                <XMarkIcon className="w-12 h-12 mx-auto text-red-500 mb-2" />
                <p className="font-semibold text-lg">Generation Failed</p>
                <p className="text-sm mt-2 text-gray-400">{error}</p>
                <p className="text-xs mt-4 text-gray-500">This may be due to a missing API Key in your deployment environment or a content policy violation. Check your console for more details.</p>
            </div>
        )}
        {!isLoading && !error && imageUrl && (
          <ImageZoom
            src={imageUrl}
            alt="Generated AI model"
          />
        )}
         {!isLoading && !error && !imageUrl && (
            <div className="text-center text-gray-500">
                <p>Your generated model will appear here.</p>
            </div>
        )}
      </div>
      {!isLoading && imageUrl && (
        <div className={`mt-4 grid grid-cols-1 ${isStandalone ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-2`}>
           <ActionButton href={imageUrl} download="ai-model.jpg">
                <DownloadIcon className="w-4 h-4" />
                Save
            </ActionButton>
            <ActionButton onClick={onRegenerate} disabled={isLoading || isImprovingSharpness}>
                <RegenerateIcon className="w-4 h-4" />
                Regenerate
            </ActionButton>
            {!isStandalone && onImproveSharpness && (
                <ActionButton onClick={onImproveSharpness} disabled={isLoading || isImprovingSharpness}>
                    {isImprovingSharpness ? <Spinner /> : <SparklesIcon className="w-4 h-4" />}
                    Improve Sharpness
                </ActionButton>
            )}
        </div>
      )}
    </div>
  );
};

export default ImageDisplay;