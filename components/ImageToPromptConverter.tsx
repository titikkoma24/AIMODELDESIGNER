import React, { useState } from 'react';
import { analyzeImageForPrompt, summarizePrompt } from '../services/geminiService';
import FileUpload from './FileUpload';
import { PhotoIcon, BrainIcon, SparklesIcon, ClipboardIcon } from './icons';
import Spinner from './Spinner';

const ImageToPromptConverter: React.FC = () => {
    const [sourceImage, setSourceImage] = useState<{ file: File; preview: string } | null>(null);
    const [detailedPrompt, setDetailedPrompt] = useState<string>('');
    const [summarizedPrompt, setSummarizedPrompt] = useState<string>('');
    const [detailLevel, setDetailLevel] = useState<'Concise' | 'Detailed' | 'Artistic'>('Detailed');
    
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [isLoadingSummarization, setIsLoadingSummarization] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState<string>('');

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSourceImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setDetailedPrompt('');
        setSummarizedPrompt('');
        setError(null);
        setCopySuccess('');
    };

    const handleAnalyze = async () => {
        if (!sourceImage) {
            setError("Please upload an image first.");
            return;
        }
        setIsLoadingAnalysis(true);
        setError(null);
        setDetailedPrompt('');
        setSummarizedPrompt('');
        setCopySuccess('');
        try {
            const base64Image = sourceImage.preview.split(',')[1];
            const result = await analyzeImageForPrompt(base64Image);
            setDetailedPrompt(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
        } finally {
            setIsLoadingAnalysis(false);
        }
    };
    
    const handleSummarize = async () => {
        if (!detailedPrompt) {
            setError("Please analyze an image first to generate a detailed prompt.");
            return;
        }
        setIsLoadingSummarization(true);
        setError(null);
        setSummarizedPrompt('');
        setCopySuccess('');
        try {
            const result = await summarizePrompt(detailedPrompt, detailLevel);
            setSummarizedPrompt(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during summarization.");
        } finally {
            setIsLoadingSummarization(false);
        }
    };

    const handleCopyToClipboard = () => {
        const textToCopy = summarizedPrompt || detailedPrompt;
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setCopySuccess('Failed to copy');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };
    
    const DetailButton: React.FC<{ level: 'Concise' | 'Detailed' | 'Artistic' }> = ({ level }) => (
        <button
            onClick={() => setDetailLevel(level)}
            className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${detailLevel === level ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
            {level}
        </button>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <FileUpload
                    onImageUpload={handleImageUpload}
                    title="1. Upload Image for Analysis"
                    description="Upload any image to have the AI analyze it and generate a detailed text prompt."
                />
                <button
                    onClick={handleAnalyze}
                    disabled={!sourceImage || isLoadingAnalysis}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                >
                    {isLoadingAnalysis ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                    {isLoadingAnalysis ? 'Analyzing...' : 'Analyze Image'}
                </button>
                
                {detailedPrompt && (
                    <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 pt-6 border-t border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-200">2. Refine Prompt</h3>
                        <p className="text-sm text-gray-400">Choose a detail level to refine the verbose analysis into a usable prompt.</p>
                        <div className="grid grid-cols-3 gap-2">
                            <DetailButton level="Concise" />
                            <DetailButton level="Detailed" />
                            <DetailButton level="Artistic" />
                        </div>
                        <button
                            onClick={handleSummarize}
                            disabled={isLoadingSummarization}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                        >
                            {isLoadingSummarization ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                            {isLoadingSummarization ? 'Refining...' : 'Refine Prompt'}
                        </button>
                    </div>
                )}
                 {error && (
                    <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mt-auto" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4">Source Image</h3>
                    {sourceImage ? (
                        <div className="bg-gray-900/50 rounded-lg p-2 flex items-center justify-center">
                            <img src={sourceImage.preview} alt="Uploaded source" className="rounded-md max-w-full max-h-64 object-contain shadow-lg" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8 min-h-[200px]">
                            <PhotoIcon className="w-16 h-16 mb-4" />
                            <p>Your uploaded image will appear here.</p>
                        </div>
                    )}
                </div>
                <div className="flex-grow flex flex-col mt-4 space-y-4">
                    <div>
                        <h3 className="text-xl font-semibold text-cyan-400 mb-2">AI Analysis Result</h3>
                        <div className="bg-gray-900/50 rounded-lg p-2 min-h-[150px]">
                            {isLoadingAnalysis ? (
                                <div className="flex items-center justify-center h-full"><Spinner /><span className="ml-3 text-gray-400">Analyzing image...</span></div>
                            ) : (
                                <textarea readOnly value={detailedPrompt} className="w-full h-full p-2 text-sm text-gray-300 bg-transparent rounded-lg border-none resize-none focus:ring-0" placeholder="Detailed analysis will appear here." />
                            )}
                        </div>
                    </div>
                     <div>
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-xl font-semibold text-cyan-400">Refined Prompt</h3>
                             <button onClick={handleCopyToClipboard} disabled={!summarizedPrompt && !detailedPrompt} className="flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-50">
                                <ClipboardIcon className="w-4 h-4" />
                                {copySuccess || 'Copy'}
                             </button>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-2 min-h-[100px]">
                            {isLoadingSummarization ? (
                                <div className="flex items-center justify-center h-full"><Spinner /><span className="ml-3 text-gray-400">Refining prompt...</span></div>
                            ) : (
                                <textarea readOnly value={summarizedPrompt} className="w-full h-full p-2 text-sm text-gray-300 bg-transparent rounded-lg border-none resize-none focus:ring-0" placeholder="Refined prompt will appear here." />
                            )}
                        </div>
                    </div>
                     <div className="text-xs text-gray-500 bg-gray-900/50 p-3 rounded-lg mt-auto">
                        <strong>How to use:</strong> This prompt is designed for models like 'gemini-2.5-flash-image-preview'. For best results, provide both the refined text prompt and your original uploaded image as inputs to the model.
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ImageToPromptConverter;
