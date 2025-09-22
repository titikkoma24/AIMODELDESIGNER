import React from 'react';
import { hairTemplates, expressionTemplates } from '../constants/hairTemplates';
import FileUpload from './FileUpload';
import { BodyShape, BustSize, ButtocksSize, WaistSize } from '../types';

interface ControlPanelProps {
  imageUploaded: boolean;
  hairOption: 'main-photo' | 'reference-photo' | 'manual' | 'template';
  setHairOption: (option: 'main-photo' | 'reference-photo' | 'manual' | 'template') => void;
  manualHair: string;
  setManualHair: (value: string) => void;
  selectedTemplate: string;
  setSelectedTemplate: (value: string) => void;
  gender: 'female' | 'male';
  selectedExpression: string;
  setSelectedExpression: (value: string) => void;
  onHairImageUpload: (file: File) => void;
  hairImagePreview: string | null;
  bodyShape: BodyShape;
  setBodyShape: (value: BodyShape) => void;
  bustSize: BustSize;
  setBustSize: (value: BustSize) => void;
  buttocksSize: ButtocksSize;
  setButtocksSize: (value: ButtocksSize) => void;
  waistSize: WaistSize;
  setWaistSize: (value: WaistSize) => void;
  height: number;
  setHeight: (value: number) => void;
  isChildDetected?: boolean;
}

const SelectableButton: React.FC<{
    onClick: () => void;
    label: string;
    isActive: boolean;
    disabled?: boolean;
    className?: string;
}> = ({ onClick, label, isActive, disabled, className = '' }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
            isActive
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600'
        } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
        {label}
    </button>
);

const bodyShapes: BodyShape[] = ['Sedang', 'Skinny', 'Curvy', 'Athletic', 'Overweight', 'Obese', 'Special Body'];
const bustSizes: BustSize[] = ['Small', 'Medium', 'Large', 'Extra Large'];
const buttocksSizes: ButtocksSize[] = ['Small', 'Medium', 'Large', 'Extra Large'];
const waistSizes: WaistSize[] = ['Kecil', 'Sedang', 'Besar'];

const ControlPanel: React.FC<ControlPanelProps> = ({
  imageUploaded,
  hairOption,
  setHairOption,
  manualHair,
  setManualHair,
  selectedTemplate,
  setSelectedTemplate,
  gender,
  selectedExpression,
  setSelectedExpression,
  onHairImageUpload,
  hairImagePreview,
  bodyShape,
  setBodyShape,
  bustSize,
  setBustSize,
  buttocksSize,
  setButtocksSize,
  waistSize,
  setWaistSize,
  height,
  setHeight,
  isChildDetected = false,
}) => {
  const isCustomizing = imageUploaded;

  return (
    <div className="space-y-6">
      <div className={`space-y-6 transition-opacity duration-500 ${isCustomizing ? 'opacity-100' : 'opacity-50'}`}>
        <div>
          <p className="text-gray-400">
            Adjust hair, expression, and body shape for your model.
          </p>
        </div>
        
        {/* Hair Settings Section */}
        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Hair Settings</h3>
          <fieldset className="space-y-2">
            <legend className="sr-only">Hair Source</legend>
            <div className="flex items-center">
              <input id="hair-main-photo" name="hair-option" type="radio" checked={hairOption === 'main-photo'} onChange={() => setHairOption('main-photo')} disabled={!isCustomizing} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
              <label htmlFor="hair-main-photo" className="ml-3 block text-sm font-medium text-gray-300">Use hair from main photo</label>
            </div>
             <div className="flex items-center">
              <input id="hair-reference-photo" name="hair-option" type="radio" checked={hairOption === 'reference-photo'} onChange={() => setHairOption('reference-photo')} disabled={!isCustomizing} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
              <label htmlFor="hair-reference-photo" className="ml-3 block text-sm font-medium text-gray-300">Use hair reference photo</label>
            </div>
            <div className="flex items-center">
              <input id="hair-manual" name="hair-option" type="radio" checked={hairOption === 'manual'} onChange={() => setHairOption('manual')} disabled={!isCustomizing} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
              <label htmlFor="hair-manual" className="ml-3 block text-sm font-medium text-gray-300">Describe hair manually</label>
            </div>
            <div className="flex items-center">
              <input id="hair-template" name="hair-option" type="radio" checked={hairOption === 'template'} onChange={() => setHairOption('template')} disabled={!isCustomizing} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
              <label htmlFor="hair-template" className="ml-3 block text-sm font-medium text-gray-300">Choose a template</label>
            </div>
          </fieldset>

          {hairOption === 'reference-photo' && (
            <div className="pl-5 pt-2 space-y-3">
                 <FileUpload 
                    onImageUpload={onHairImageUpload}
                    title=""
                    description="Upload an image for hairstyle reference."
                    disabled={!isCustomizing}
                 />
                 {hairImagePreview && (
                    <div className="p-2 bg-gray-800 rounded-lg">
                        <p className="text-xs text-center text-gray-400 mb-2">Hair Reference Preview</p>
                        <img src={hairImagePreview} alt="Hair reference preview" className="rounded-md max-h-32 mx-auto" />
                    </div>
                )}
            </div>
          )}

          {hairOption === 'manual' && (
            <div>
              <label htmlFor="manual-hair" className="sr-only">Manual Hair Description</label>
              <textarea
                id="manual-hair"
                rows={2}
                value={manualHair}
                onChange={(e) => setManualHair(e.target.value)}
                disabled={!isCustomizing}
                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:cursor-not-allowed"
                placeholder="e.g., vibrant pink short bob with bangs"
              />
            </div>
          )}

          {hairOption === 'template' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Showing templates for: <span className="font-semibold text-gray-200">{gender === 'female' ? 'Female' : 'Male'}</span></p>
              <label htmlFor="template-hair" className="sr-only">Hair Template</label>
              <select
                id="template-hair"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                disabled={!isCustomizing}
                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:cursor-not-allowed"
              >
                <option value="" disabled>Select a hairstyle...</option>
                {hairTemplates[gender].map(template => (
                  <option key={template} value={template}>{template}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* Expression Settings Section */}
        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Expression Settings</h3>
           <div>
              <label htmlFor="expression-template" className="sr-only">Expression Template</label>
              <select
                id="expression-template"
                value={selectedExpression}
                onChange={(e) => setSelectedExpression(e.target.value)}
                disabled={!isCustomizing}
                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:cursor-not-allowed"
              >
                {expressionTemplates.map(template => (
                  <option key={template} value={template}>{template}</option>
                ))}
              </select>
            </div>
        </div>

        {/* Height Settings Section */}
        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Height Settings</h3>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-300 mb-2">
              Height ({height} cm)
            </label>
            <input
              id="height"
              type="range"
              min="100"
              max="210"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              disabled={!isCustomizing}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-2">Set model height, from a 5-year-old child to a tall adult.</p>
          </div>
        </div>

        {/* Body Shape Settings Section */}
        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Body Shape Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Body Shape</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {bodyShapes.map(shape => (
                        <SelectableButton
                            key={shape}
                            onClick={() => setBodyShape(shape)}
                            label={shape}
                            isActive={bodyShape === shape}
                            disabled={!isCustomizing}
                        />
                    ))}
                </div>
            </div>

            <div className={`pt-2 ${isChildDetected || (gender === 'female' && bodyShape === 'Special Body') ? 'opacity-50' : ''}`}>
                <label className="block text-sm font-medium text-gray-300 mb-2">Ukuran Pinggang/Perut (Waist)</label>
                <div className="grid grid-cols-3 gap-2">
                    {waistSizes.map(size => (
                        <SelectableButton
                            key={size}
                            onClick={() => setWaistSize(size)}
                            label={size}
                            isActive={waistSize === size}
                            disabled={!isCustomizing || isChildDetected || (gender === 'female' && bodyShape === 'Special Body')}
                        />
                    ))}
                </div>
            </div>

            {gender === 'female' && (
                <>
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 ${isChildDetected || bodyShape === 'Special Body' ? 'opacity-50' : ''}`}>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Bust Size</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {bustSizes.map(size => (
                                    <SelectableButton
                                        key={size}
                                        onClick={() => setBustSize(size)}
                                        label={size}
                                        isActive={bustSize === size}
                                        disabled={!isCustomizing || isChildDetected || bodyShape === 'Special Body'}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Buttocks Size</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {buttocksSizes.map(size => (
                                    <SelectableButton
                                        key={size}
                                        onClick={() => setButtocksSize(size)}
                                        label={size}
                                        isActive={buttocksSize === size}
                                        disabled={!isCustomizing || isChildDetected || bodyShape === 'Special Body'}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    {(isChildDetected || bodyShape === 'Special Body') && (
                        <p className="text-xs text-yellow-400 -mt-2">
                            {bodyShape === 'Special Body' 
                                ? "Waist, Bust and Buttocks are automatically set by the 'Special Body' type."
                                : "Waist, Bust and Buttocks size controls are disabled for subjects detected as children."
                            }
                        </p>
                    )}
                </>
            )}

            {gender === 'male' && isChildDetected && (
                <p className="text-xs text-yellow-400 pt-2">
                    Waist size control is disabled for subjects detected as children.
                </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;