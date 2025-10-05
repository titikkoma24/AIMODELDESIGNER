import React, { useState, useCallback } from 'react';
import { generateVideoPrompts, VideoPromptResult } from '../services/geminiService';
import { SparklesIcon, ClipboardIcon, CheckIcon } from './icons';
import Spinner from './Spinner';

type Platform = 'meta' | 'veo' | 'sora';

interface ImprovedPrompts {
    meta: VideoPromptResult;
    veo: VideoPromptResult;
    sora: VideoPromptResult;
}

const VideoGenerator: React.FC = () => {
    const [userPrompt, setUserPrompt] = useState<string>('A majestic elephant walking through a vibrant jungle during a thunderstorm.');
    const [improvedPrompts, setImprovedPrompts] = useState<ImprovedPrompts | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Platform>('meta');
    const [copiedPrompt, setCopiedPrompt] = useState<Platform | null>(null);

    const handleImprovePrompt = useCallback(async () => {
        if (!userPrompt.trim()) {
            setError('Please enter a theme or idea for your video.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setImprovedPrompts(null);

        try {
            const result = await generateVideoPrompts(userPrompt);
            setImprovedPrompts(result);
            setActiveTab('meta'); // Reset to the first tab
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while improving the prompt.');
        } finally {
            setIsLoading(false);
        }
    }, [userPrompt]);
    
    const handleCopyToClipboard = (text: string, platform: Platform) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedPrompt(platform);
            setTimeout(() => setCopiedPrompt(null), 2000); // Reset after 2 seconds
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    const TabButton: React.FC<{
        platform: Platform;
        label: string;
        logoUrl: string;
    }> = ({ platform, label, logoUrl }) => (
        <button
            onClick={() => setActiveTab(platform)}
            className={`flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === platform 
                    ? 'bg-cyan-600 text-white shadow-md' 
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
        >
            <img src={logoUrl} alt={`${label} logo`} className="w-5 h-5" />
            {label}
        </button>
    );

    const PromptDisplay: React.FC<{ platform: Platform; data: VideoPromptResult }> = ({ platform, data }) => (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold text-gray-200">Generated Prompt</h4>
                    <button
                        onClick={() => handleCopyToClipboard(data.prompt, platform)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
                    >
                        {copiedPrompt === platform ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                        {copiedPrompt === platform ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <textarea
                    readOnly
                    value={data.prompt}
                    className="w-full h-48 p-3 text-sm text-gray-300 bg-gray-900/50 rounded-lg border border-gray-600 resize-none"
                    aria-label={`Generated prompt for ${platform}`}
                />
            </div>
            <div>
                <h4 className="text-lg font-semibold text-gray-200 mb-2">Why this prompt works</h4>
                <div className="p-3 text-sm text-gray-400 bg-gray-900/50 rounded-lg border border-gray-600">
                    <p>{data.explanation}</p>
                </div>
            </div>
        </div>
    );


    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Prompt to Video Generator</h2>
                <p className="mt-2 text-gray-400">Enter a simple idea, and let AI craft detailed, platform-specific prompts for stunning video results.</p>
            </div>

            <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl space-y-4">
                <label htmlFor="video-prompt" className="block text-lg font-semibold text-cyan-400 mb-2">
                    Enter your video theme or idea
                </label>
                <textarea
                    id="video-prompt"
                    rows={4}
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-70 disabled:cursor-not-allowed"
                    placeholder="e.g., A futuristic city at night in the rain"
                />
                <button
                    onClick={handleImprovePrompt}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                >
                    {isLoading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                    {isLoading ? 'Improving...' : 'Improve Prompt for Video AI'}
                </button>
            </div>

            {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                    <p className="font-semibold">An Error Occurred</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}
            
            {(isLoading || improvedPrompts) && (
                 <div className="bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Spinner />
                            <p className="mt-3">Generating tailored prompts...</p>
                        </div>
                    ) : improvedPrompts && (
                       <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-center text-white">Your AI-Enhanced Prompts</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <TabButton platform="meta" label="Meta AI" logoUrl="https://static.xx.fbcdn.net/rsrc.php/yT/r/aGT3gskde8a.ico" />
                                <TabButton platform="veo" label="Google Veo" logoUrl="https://www.google.com/images/errors/logo_sm_2.png" />
                                <TabButton platform="sora" label="Sora (ChatGPT)" logoUrl="https://seeklogo.com/images/C/chatgpt-logo-02AFA704B5-seeklogo.com.png" />
                            </div>
                            <div className="mt-4">
                                {activeTab === 'meta' && <PromptDisplay platform="meta" data={improvedPrompts.meta} />}
                                {activeTab === 'veo' && <PromptDisplay platform="veo" data={improvedPrompts.veo} />}
                                {activeTab === 'sora' && <PromptDisplay platform="sora" data={improvedPrompts.sora} />}
                            </div>
                       </div>
                    )}
                 </div>
            )}

        </div>
    );
};

export default VideoGenerator;