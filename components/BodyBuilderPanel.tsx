import React from 'react';
import { BodyType, BodyMeasurements } from '../types';
import FileUpload from './FileUpload';
import { PhotoIcon } from './icons';

interface BodyBuilderPanelProps {
  imageUploaded: boolean;
  gender: 'female' | 'male';
  bodyType: BodyType;
  setBodyType: (value: BodyType) => void;
  height: number;
  setHeight: (value: number) => void;
  skinColor: string;
  setSkinColor: (value: string) => void;
  bustSize: BodyMeasurements;
  setBustSize: (value: BodyMeasurements) => void;
  buttocksSize: BodyMeasurements;
  setButtocksSize: (value: BodyMeasurements) => void;
  onBodyImageUpload: (file: File) => void;
  bodyImagePreview: string | null;
}

const bodyTypes: BodyType[] = ['Slim', 'Average', 'Athletic', 'Chubby', 'Obese'];
const measurementOptions: BodyMeasurements[] = ['Small', 'Medium', 'Full', 'Large'];

const SelectableButton: React.FC<{
    onClick: () => void;
    label: string;
    isActive: boolean;
    disabled?: boolean;
}> = ({ onClick, label, isActive, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
            isActive
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {label}
    </button>
);


const BodyBuilderPanel: React.FC<BodyBuilderPanelProps> = ({
  imageUploaded,
  gender,
  bodyType,
  setBodyType,
  height,
  setHeight,
  skinColor,
  setSkinColor,
  bustSize,
  setBustSize,
  buttocksSize,
  setButtocksSize,
  onBodyImageUpload,
  bodyImagePreview,
}) => {
  const isCustomizing = imageUploaded;

  return (
    <div className="space-y-6">
       <div className={`space-y-6 transition-opacity duration-500 ${isCustomizing ? 'opacity-100' : 'opacity-50'}`}>
        
        {/* Body Reference Upload */}
        <FileUpload
            onImageUpload={onBodyImageUpload}
            title="Optional: Upload Full Body Photo"
            description="Use this to reference a specific body shape and pose."
            disabled={!isCustomizing}
        />
        {bodyImagePreview && (
          <div className="p-2 bg-gray-900/50 rounded-lg">
            <p className="text-sm text-center text-gray-400 mb-2">Body Reference Preview</p>
            <img src={bodyImagePreview} alt="Body reference" className="rounded-md max-h-40 mx-auto" />
          </div>
        )}
        
         <div>
            <p className="text-gray-400 text-sm p-2 bg-gray-900/40 rounded-md">
                When you provide a body reference, the AI will combine the face from your main photo with the body from this photo. The settings below (Body Type, Height, etc.) will then be applied to refine the result.
                <br/><br/>
                If you don't provide a body reference, the AI will create a new body from scratch using only the settings below.
            </p>
         </div>

         {/* Body Type */}
         <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-gray-300">Body Type</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {bodyTypes.map(type => (
                    <SelectableButton 
                        key={type}
                        onClick={() => setBodyType(type)}
                        label={type}
                        isActive={bodyType === type}
                        disabled={!isCustomizing}
                    />
                ))}
            </div>
         </div>

        {/* Height & Skin Tone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
                <label htmlFor="height" className="block text-sm font-medium text-gray-300">
                    Height ({height} cm)
                </label>
                <input
                    id="height"
                    type="range"
                    min="140"
                    max="210"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    disabled={!isCustomizing}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:cursor-not-allowed"
                />
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
                 <label htmlFor="skin-color" className="block text-sm font-medium text-gray-300">
                    Skin Tone
                </label>
                <div className="flex items-center gap-3">
                    <input
                        id="skin-color"
                        type="color"
                        value={skinColor}
                        onChange={(e) => setSkinColor(e.target.value)}
                        disabled={!isCustomizing}
                        className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-gray-400 font-mono text-sm">{skinColor}</span>
                </div>
            </div>
        </div>

        {/* Optional Female Measurements */}
        {gender === 'female' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Bust Size (Optional)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {measurementOptions.map(option => (
                           <SelectableButton 
                                key={option}
                                onClick={() => setBustSize(option)}
                                label={option}
                                isActive={bustSize === option}
                                disabled={!isCustomizing}
                           />
                        ))}
                    </div>
                 </div>
                 <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
                    <label className="block text-sm font-medium text-gray-300">Buttocks Size (Optional)</label>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {measurementOptions.map(option => (
                           <SelectableButton 
                                key={option}
                                onClick={() => setButtocksSize(option)}
                                label={option}
                                isActive={buttocksSize === option}
                                disabled={!isCustomizing}
                           />
                        ))}
                    </div>
                 </div>
            </div>
        )}
       </div>
    </div>
  );
};

export default BodyBuilderPanel;