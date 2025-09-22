import React, { useState, useCallback } from 'react';
import { editWithNanoBanana, improvePrompt, translateText } from '../services/geminiService';
import { shotStyles, lightStyles, aspectRatios } from '../constants/backgroundTemplates';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon, XMarkIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';

const NanoBananaEditor: React.FC = () => {
    const [sourceImages, setSourceImages] = useState<{ file: File; preview: string }[]>([]);
    const [prompt, setPrompt] = useState<string>('Make the person wear a futuristic cyberpunk jacket');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(aspectRatios[0]);
    const [selectedShotStyle, setSelectedShotStyle] = useState<string>(shotStyles[0]);
    const [selectedLightStyle, setSelectedLightStyle] = useState<string>(lightStyles[0]);
    
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isImprovingPrompt, setIsImprovingPrompt] = useState<boolean>(false);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);


    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSourceImages(prev => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
        setGeneratedImage(null);
        setError(null);
    };

    const removeImage = (indexToRemove: number) => {
        setSourceImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handlePromptChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newPrompt = e.target.value;
        setPrompt(newPrompt);

        if (newPrompt.endsWith('..')) {
            const textToTranslate = newPrompt.slice(0, -2);
            if (!textToTranslate.trim()) {
                setPrompt('');
                return;
            }

            setIsTranslating(true);
            setError(null);
            try {
                const translatedText = await translateText(textToTranslate, 'English');
                setPrompt(translatedText);
            } catch (error) {
                console.error('Translation failed:', error);
                setError('Failed to translate prompt. Please try again.');
                setPrompt(textToTranslate);
            } finally {
                setIsTranslating(false);
            }
        }
    };

    const handleImprovePrompt = useCallback(async () => {
        if (!prompt.trim()) return;
        setIsImprovingPrompt(true);
        setError(null);
        try {
            const improved = await improvePrompt(prompt);
            setPrompt(improved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to improve prompt.');
        } finally {
            setIsImprovingPrompt(false);
        }
    }, [prompt]);

    const handleGenerate = useCallback(async () => {
        if (sourceImages.length === 0) {
            setError('Please upload at least one image to edit.');
            return;
        }
        if (!prompt.trim()) {
            setError('Please enter a prompt to describe the edits.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const base64Images = sourceImages.map(img => img.preview.split(',')[1]);
            const result = await editWithNanoBanana(
                base64Images,
                prompt,
                selectedShotStyle,
                selectedLightStyle,
                selectedAspectRatio
            );
            setGeneratedImage(`data:image/jpeg;base64,${result}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    }, [sourceImages, prompt, selectedShotStyle, selectedLightStyle, selectedAspectRatio]);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                    <FileUpload
                        onImageUpload={handleImageUpload}
                        title="1. Upload Photos for Editing"
                        description="Upload one or more images. The first image will be the main subject for edits."
                    />

                    {sourceImages.length > 0 && (
                        <div className="p-4 bg-gray-900/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-200 mb-3">Uploaded Photos ({sourceImages.length})</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {sourceImages.map((image, index) => (
                                    <div key={index} className="relative group aspect-w-1 aspect-h-1">
                                        <img src={image.preview} alt={`Source ${index + 1}`} className="rounded-md w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            aria-label="Remove image"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {sourceImages.length > 0 && (
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">2. Describe Your Edits</h3>
                             <p className="text-sm text-gray-400">
                                The AI will apply your edits while preserving the person's face. Add `..` at the end to automatically translate your prompt to English.
                            </p>
                            <div>
                                <label htmlFor="nano-prompt" className="sr-only">Prompt</label>
                                <div className="relative">
                                    <textarea
                                        id="nano-prompt"
                                        rows={3}
                                        value={prompt}
                                        onChange={handlePromptChange}
                                        disabled={isLoading || isTranslating || isImprovingPrompt}
                                        className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                                        placeholder="e.g., Change the background to a Paris street"
                                    />
                                    {(isTranslating || isImprovingPrompt) && (
                                        <div className="absolute inset-0 bg-gray-800/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                            <Spinner />
                                            <span className="ml-3 text-gray-200">{isTranslating ? 'Translating...' : 'Improving...'}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleImprovePrompt}
                                    disabled={!prompt.trim() || isImprovingPrompt || isLoading || isTranslating}
                                    className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                                >
                                    {isImprovingPrompt ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                                    {isImprovingPrompt ? 'Improving...' : 'AI Improvement'}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {sourceImages.length > 0 && (
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">3. Output Settings</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="nano-aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                                    <select id="nano-aspect-ratio" value={selectedAspectRatio} onChange={(e) => setSelectedAspectRatio(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                        {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="nano-shot-style" className="block text-sm font-medium text-gray-300 mb-2">Shot Style</label>
                                    <select id="nano-shot-style" value={selectedShotStyle} onChange={(e) => setSelectedShotStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                        {shotStyles.map(style => <option key={style} value={style}>{style}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="nano-light-style" className="block text-sm font-medium text-gray-300 mb-2">Light Style</label>
                                    <select id="nano-light-style" value={selectedLightStyle} onChange={(e) => setSelectedLightStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                        {lightStyles.map(style => <option key={style} value={style}>{style}</option>)}
                                    </select>
                                </div>
                             </div>
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={sourceImages.length === 0 || isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                    >
                        {isLoading ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                        {isLoading ? 'Generating...' : 'Generate with Nano Banana'}
                    </button>
                </div>

                {/* Right Column: Output */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Original Photos</h3>
                            {sourceImages.length > 0 ? (
                                <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-2">
                                        {sourceImages.map((image, index) => (
                                            <img key={index} src={image.preview} alt={`Original content ${index + 1}`} className="rounded-md w-full object-contain shadow-lg" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                                    <PhotoIcon className="w-16 h-16 mb-4" />
                                    <p>Your uploaded photo(s) will appear here.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <ImageDisplay
                                imageUrl={generatedImage}
                                isLoading={isLoading}
                                onRegenerate={handleGenerate}
                                isStandalone={true}
                                title="Edited Image"
                                error={error}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NanoBananaEditor;