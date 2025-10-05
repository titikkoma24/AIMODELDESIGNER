import React, { useState, useCallback, useEffect } from 'react';
import { changeBackground, improvePrompt, translateText, getFriendlyErrorMessage } from '../services/geminiService';
import { lightStyles, imageStyles } from '../constants/backgroundTemplates';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon, SparklesIcon, XMarkIcon } from './icons';
import Spinner from './Spinner';

const popularShotStyles = [
    "Medium Shot",
    "Medium Close-up",
    "Full-Body Shot",
    "Close-up Portrait",
    "Wide Shot (Shows context)",
    "Low-Angle (Looking up)",
    "High-Angle (Looking down)",
    "Bird's-Eye View",
    "Eye-Level Shot",
    "Fashion Magazine Cover Style",
    "Candid Street Photography",
    "Cinematic Frame"
];

const aspectRatioOptions = ['Pilih Rasio', '16:9', '9:16', '1:1', '4:5'];

const qualityLevels = ['Standard', 'HD', '2K', '4K', '8K'];

const qualityPromptTemplates: { [key: string]: string } = {
    'Standard': '',
    'HD': "ensure the output is in High Definition (1080p) quality with excellent detail and sharpness.",
    '2K': "generate a 2K resolution image with high fidelity, professional-grade detail, and crisp sharpness.",
    '4K': "generate a hyper-detailed 4K resolution image. Focus on extreme sharpness, photorealistic textures, and clarity.",
    '8K': "generate an ultra-realistic 8K resolution masterpiece. The image must have impeccable, photorealistic textures, intricate details, and perfect sharpness, simulating a shot from a high-end cinematic camera."
};

const BackgroundChanger: React.FC = () => {
    const [sourceImages, setSourceImages] = useState<{ file: File; preview: string }[]>([]);
    const [prompt, setPrompt] = useState<string>('A hyperrealistic sun-drenched beach with turquoise water and white sand.');
    const [selectedShotStyle, setSelectedShotStyle] = useState<string>(popularShotStyles[0]);
    const [selectedLightStyle, setSelectedLightStyle] = useState<string>(lightStyles[0].name);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(aspectRatioOptions[0]);
    const [selectedImageStyle, setSelectedImageStyle] = useState<string>('Pilih Style');
    const [selectedQuality, setSelectedQuality] = useState<string>('Standard');

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isImprovingPrompt, setIsImprovingPrompt] = useState<boolean>(false);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [addLockPrompt, setAddLockPrompt] = useState<boolean>(false);
    const [improvePose, setImprovePose] = useState<boolean>(false);
    const [improveDresscode, setImproveDresscode] = useState<boolean>(false);
    const [isPromptFromAI, setIsPromptFromAI] = useState<boolean>(false);
    const [lightStyleDescription, setLightStyleDescription] = useState<string>('');

    const lockPromptText = "Don't change the details of the face, and also the hair. Maintain 100% similarity, make it very natural with natural lighting, and also make the image sharp. Like it was taken using a Sony A7R V camera.";
    const improvePoseAndDresscodeText = "Improve the pose of this object to suit the new setting. Make it very realistic, with natural lighting, sharp details, and high contrast. Also, adjust the dress code to enhance the atmosphere of the object in the new setting.";
    const aspectRatioPromptTemplate = (ratio: string) => `pastikan menggunakan aspect ratio ${ratio}. Utamakan komposisi tetap seimbang, objek utama tidak terpotong, dan framing menyesuaikan rasio tersebut. Gambar harus tetap proporsional, tidak melebar atau gepeng, dengan ruang kosong (negative space) yang harmonis.`;
    const imageStylePromptTemplate = (styleName: string) => `Generate the final image in a ${styleName} style.`;


    useEffect(() => {
        const lockRegex = new RegExp(lockPromptText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const poseDressRegex = new RegExp(improvePoseAndDresscodeText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        const aspectRegex = /pastikan menggunakan aspect ratio.*harmonis\./g;
        const styleRegex = /Generate the final image in a .*? style\./g;
        const qualityPrompts = Object.values(qualityPromptTemplates).filter(p => p).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const qualityRegex = new RegExp(qualityPrompts.join('|'), 'g');

        const basePrompt = prompt
            .replace(lockRegex, '')
            .replace(poseDressRegex, '')
            .replace(aspectRegex, '')
            .replace(styleRegex, '')
            .replace(qualityRegex, '')
            .replace(/\s+/g, ' ').trim();

        let finalPrompt = basePrompt;

        if (addLockPrompt) {
            finalPrompt = `${finalPrompt} ${lockPromptText}`.trim();
        }
        if (improvePose || improveDresscode) {
            finalPrompt = `${finalPrompt} ${improvePoseAndDresscodeText}`.trim();
        }
        if (selectedAspectRatio !== aspectRatioOptions[0]) {
             finalPrompt = `${finalPrompt} ${aspectRatioPromptTemplate(selectedAspectRatio)}`.trim();
        }
        if (selectedImageStyle !== 'Pilih Style') {
            const styleValue = imageStyles.find(s => s.name === selectedImageStyle)?.promptValue;
            if (styleValue) {
                finalPrompt = `${finalPrompt} ${imageStylePromptTemplate(styleValue)}`.trim();
            }
        }
        if (selectedQuality !== 'Standard') {
            finalPrompt = `${finalPrompt} ${qualityPromptTemplates[selectedQuality]}`.trim();
        }
        
        if (finalPrompt !== prompt) {
             setPrompt(finalPrompt);
        }
    }, [addLockPrompt, improvePose, improveDresscode, selectedAspectRatio, selectedImageStyle, selectedQuality]);

    useEffect(() => {
        const selectedStyle = lightStyles.find(style => style.name === selectedLightStyle);
        setLightStyleDescription(selectedStyle ? selectedStyle.description : '');
      }, [selectedLightStyle]);


    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSourceImages(prev => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
        setCurrentImage(null);
        setHistory([]);
        setError(null);
    };

    const removeImage = (indexToRemove: number) => {
        setSourceImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handlePromptChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setIsPromptFromAI(false);
        const newPrompt = e.target.value;
        setPrompt(newPrompt);

        // Update checkboxes and dropdown if user manually deletes text
        if (!newPrompt.includes(lockPromptText)) {
            setAddLockPrompt(false);
        }
        if (!newPrompt.includes(improvePoseAndDresscodeText)) {
            setImprovePose(false);
            setImproveDresscode(false);
        }
        if (!/pastikan menggunakan aspect ratio/.test(newPrompt)) {
            setSelectedAspectRatio(aspectRatioOptions[0]);
        }
        if (!/Generate the final image in a .*? style\./.test(newPrompt)) {
            setSelectedImageStyle('Pilih Style');
        }

        const qualityPrompts = Object.values(qualityPromptTemplates).filter(p => p);
        const qualityFound = qualityPrompts.some(p => newPrompt.includes(p));
        if (!qualityFound) {
            setSelectedQuality('Standard');
        }


        let translationConfig: { trigger: string; lang: string; } | null = null;
        if (newPrompt.endsWith('.,')) {
            translationConfig = { trigger: '.,', lang: 'Indonesian' };
        } else if (newPrompt.endsWith('..')) {
            translationConfig = { trigger: '..', lang: 'English' };
        }

        if (translationConfig) {
            const textToTranslate = newPrompt.slice(0, -translationConfig.trigger.length);
            if (!textToTranslate.trim()) {
                setPrompt('');
                return;
            }

            setIsTranslating(true);
            setError(null);
            try {
                const translatedText = await translateText(textToTranslate, translationConfig.lang);
                setPrompt(translatedText);
            } catch (err) {
                console.error('Translation failed:', err);
                setError(getFriendlyErrorMessage(err));
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
            setIsPromptFromAI(true);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsImprovingPrompt(false);
        }
    }, [prompt]);

    const handleGenerate = useCallback(async () => {
        if (sourceImages.length === 0) {
            setError('Please upload at least one image first.');
            return;
        }
        if (!prompt.trim()) {
            setError('Please enter a description for the new background.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setCurrentImage(null);

        try {
            const base64Images = sourceImages.map(img => img.preview.split(',')[1]);
            const aspectRatioForApi = selectedAspectRatio === aspectRatioOptions[0] ? '1:1' : selectedAspectRatio;

            const result = await changeBackground(
                base64Images,
                prompt,
                selectedShotStyle,
                selectedLightStyle,
                aspectRatioForApi,
                true // Aspect ratio is always locked now
            );
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [sourceImages, prompt, selectedShotStyle, selectedLightStyle, selectedAspectRatio]);
    
    const canGenerate = sourceImages.length > 0 && !isLoading;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <FileUpload
                    onImageUpload={handleImageUpload}
                    title="1. Upload Photo(s)"
                    description="Upload one or more photos. The subjects will be combined into a new scene."
                />

                {sourceImages.length > 0 && (
                     <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200">2. Describe New Background</h3>
                        <div>
                            <label htmlFor="background-prompt" className="sr-only">Background Prompt</label>
                             <p className="text-sm text-gray-400 mb-2">
                                Add `..` to translate to English, or `.,` to translate to Indonesian.
                            </p>
                            <div className="relative">
                                <textarea
                                    id="background-prompt"
                                    rows={3}
                                    value={prompt}
                                    onChange={handlePromptChange}
                                    disabled={isLoading || isTranslating || isImprovingPrompt}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 resize-none disabled:opacity-70 disabled:cursor-not-allowed"
                                    placeholder="e.g., A futuristic city skyline at night..."
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
                                {isImprovingPrompt ? 'Improving...' : 'AI Prompt Improvement'}
                            </button>

                            <div className="mt-4 pt-4 border-t border-gray-600 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div className="relative flex items-start">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="lock-details-prompt"
                                                name="lock-details-prompt"
                                                type="checkbox"
                                                checked={addLockPrompt}
                                                onChange={(e) => setAddLockPrompt(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm leading-6">
                                            <label htmlFor="lock-details-prompt" className="font-medium text-gray-300">
                                                Auto Prompt: Lock Face & Hair Details
                                            </label>
                                            <p id="lock-details-prompt-description" className="text-gray-500 text-xs">
                                                Centang untuk menambahkan prompt otomatis agar wajah dan rambut tidak berubah.
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="aspect-ratio-bg" className="block text-sm font-medium text-gray-300 mb-2">Aspek Rasio</label>
                                        <select 
                                            id="aspect-ratio-bg" 
                                            value={selectedAspectRatio} 
                                            onChange={(e) => setSelectedAspectRatio(e.target.value)} 
                                            className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                        >
                                            {aspectRatioOptions.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="image-style-bg" className="block text-sm font-medium text-gray-300">Style Gambar</label>
                                    <select
                                        id="image-style-bg"
                                        value={selectedImageStyle}
                                        onChange={(e) => setSelectedImageStyle(e.target.value)}
                                        className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        {imageStyles.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                                    </select>
                                    {selectedImageStyle !== 'Pilih Style' && (
                                        <p className="text-xs text-gray-400 mt-2">
                                            {imageStyles.find(s => s.name === selectedImageStyle)?.description}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="image-quality-bg" className="block text-sm font-medium text-gray-300">Detail dan Kualitas Gambar</label>
                                    <select
                                        id="image-quality-bg"
                                        value={selectedQuality}
                                        onChange={(e) => setSelectedQuality(e.target.value)}
                                        className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        {qualityLevels.map(level => <option key={level} value={level}>{level}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Pilih tingkat detail dan ketajaman gambar. Pilihan yang lebih tinggi dapat meningkatkan kualitas visual secara signifikan.
                                    </p>
                                </div>
                                
                                <div className="pt-2">
                                    <div className="flex gap-x-6">
                                        <div className="relative flex items-start">
                                            <div className="flex h-6 items-center">
                                                <input
                                                    id="improve-pose"
                                                    name="improve-pose"
                                                    type="checkbox"
                                                    checked={improvePose}
                                                    onChange={(e) => setImprovePose(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm leading-6">
                                                <label htmlFor="improve-pose" className="font-medium text-gray-300">
                                                    Improve Pose
                                                </label>
                                            </div>
                                        </div>
                                        <div className="relative flex items-start">
                                            <div className="flex h-6 items-center">
                                                <input
                                                    id="improve-dresscode"
                                                    name="improve-dresscode"
                                                    type="checkbox"
                                                    checked={improveDresscode}
                                                    onChange={(e) => setImproveDresscode(e.target.checked)}
                                                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                                />
                                            </div>
                                            <div className="ml-3 text-sm leading-6">
                                                <label htmlFor="improve-dresscode" className="font-medium text-gray-300">
                                                    Improve Dresscode
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-2">
                                        Centang untuk menyesuaikan pose & pakaian dengan latar baru.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {sourceImages.length > 0 && (
                    <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200">3. Stylistic Controls</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shot-style" className="block text-sm font-medium text-gray-300 mb-2">Shot Style</label>
                                <select id="shot-style" value={selectedShotStyle} onChange={(e) => setSelectedShotStyle(e.target.value)} disabled={isLoading || isPromptFromAI} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {popularShotStyles.map(style => <option key={style} value={style}>{style}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="light-style" className="block text-sm font-medium text-gray-300 mb-2">Light Style</label>
                                <select id="light-style" value={selectedLightStyle} onChange={(e) => setSelectedLightStyle(e.target.value)} disabled={isLoading || isPromptFromAI} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {lightStyles.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                                </select>
                                {lightStyleDescription && <p className="text-xs text-gray-400 mt-2">{lightStyleDescription}</p>}
                            </div>
                         </div>
                         {isPromptFromAI && (
                            <p className="text-xs text-yellow-400 text-center col-span-1 sm:col-span-2">
                                Shot & Light styles are controlled by the AI-improved prompt.
                            </p>
                        )}
                    </div>
                )}


                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                    {isLoading ? 'Generating...' : 'Change Background'}
                </button>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Original Photo(s)</h3>
                        {sourceImages.length > 0 ? (
                            <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                                 <div className="grid grid-cols-2 gap-2">
                                    {sourceImages.map((image, index) => (
                                         <div key={index} className="relative group">
                                            <img src={image.preview} alt={`Source ${index + 1}`} className="rounded-md w-full object-contain shadow-lg" />
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
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                                <PhotoIcon className="w-16 h-16 mb-4" />
                                <p>Your uploaded photo(s) will appear here.</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <ImageDisplay
                            imageUrl={currentImage}
                            isLoading={isLoading}
                            onRegenerate={handleGenerate}
                            isStandalone={true}
                            title="Result"
                            error={error}
                        />
                    </div>
                </div>
                 {history.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <h4 className="text-lg font-semibold text-cyan-400 mb-3">Generation History</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
                            {history.map((histImg, index) => (
                                <div 
                                    key={index}
                                    className="flex-shrink-0 cursor-pointer"
                                    onClick={() => setCurrentImage(histImg)}
                                    role="button"
                                    aria-label={`View history item ${index + 1}`}
                                >
                                    <img 
                                        src={histImg} 
                                        alt={`History ${index + 1}`}
                                        className={`w-24 h-24 object-cover rounded-md border-2 transition-all ${currentImage === histImg ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-gray-500'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BackgroundChanger;