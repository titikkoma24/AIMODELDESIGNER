import React, { useState, useCallback } from 'react';
import { analyzePose } from '../services/geminiService';
import FileUpload from './FileUpload';
import { PhotoIcon, BrainIcon } from './icons';
import Spinner from './Spinner';

const PoseDetector: React.FC = () => {
    const [poseImage, setPoseImage] = useState<{ file: File; preview: string } | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPoseImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setAnalysis(null);
        setError(null);
    };

    const handleAnalyzePose = useCallback(async () => {
        if (!poseImage) {
            setError("Please upload a pose image first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const base64Image = poseImage.preview.split(',')[1];
            const result = await analyzePose(base64Image);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during pose analysis.");
        } finally {
            setIsLoading(false);
        }
    }, [poseImage]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <FileUpload
                    onImageUpload={handleImageUpload}
                    title="1. Upload Pose Photo"
                    description="Upload a photo of a pose to get a detailed anatomical description for AI prompts."
                />
                <button
                    onClick={handleAnalyzePose}
                    disabled={!poseImage || isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                    {isLoading ? 'Analyzing Pose...' : 'Detect Pose Name'}
                </button>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4">Uploaded Pose</h3>
                    {poseImage ? (
                        <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                            <img src={poseImage.preview} alt="Uploaded pose preview" className="rounded-md max-w-full max-h-96 object-contain shadow-lg" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                            <PhotoIcon className="w-16 h-16 mb-4" />
                            <p>Your uploaded pose photo will appear here.</p>
                        </div>
                    )}
                </div>
                <div className="flex-grow flex flex-col mt-4">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4">AI Pose Analysis</h3>
                    <div className="bg-gray-900/50 rounded-lg p-4 flex-grow min-h-[150px]">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <Spinner />
                                <span className="ml-3 text-gray-400">Analyzing anatomy...</span>
                            </div>
                        )}
                        {error && (
                            <div className="text-red-400">{error}</div>
                        )}
                        {!isLoading && !analysis && !error && (
                            <p className="text-gray-500">The detailed pose description will appear here.</p>
                        )}
                        {analysis && (
                             <textarea
                                readOnly
                                value={analysis}
                                className="w-full h-full p-2 text-sm text-gray-300 bg-transparent rounded-lg border-none resize-none focus:ring-0"
                                aria-label="AI Pose Analysis Result"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PoseDetector;
