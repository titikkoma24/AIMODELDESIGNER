import React, { useState, useCallback, useEffect } from 'react';
import { generateModel, improveSharpness } from '../services/geminiService';
import FileUpload from './FileUpload';
import ControlPanel from './ControlPanel';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon, SparklesIcon as CustomizeIcon } from './icons';
import Spinner from './Spinner';
import { hairTemplates, expressionTemplates } from '../constants/hairTemplates';
import { BodyShape, BustSize, ButtocksSize, WaistSize } from '../types';

const ModelCreator: React.FC = () => {
    // Main face image state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Hair reference image state
    const [hairImageFile, setHairImageFile] = useState<File | null>(null);
    const [hairImagePreview, setHairImagePreview] = useState<string | null>(null);

    const [improveFace, setImproveFace] = useState<boolean>(false);
    const [gender, setGender] = useState<'female' | 'male'>('female');
    const [isHijab, setIsHijab] = useState<boolean>(false);
    const [useEnhancedPrompt, setUseEnhancedPrompt] = useState<boolean>(false);
    const [isCloseUp, setIsCloseUp] = useState<boolean>(false);

    const [hairOption, setHairOption] = useState<'main-photo' | 'reference-photo' | 'manual' | 'template'>('main-photo');
    const [manualHair, setManualHair] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>(hairTemplates.female[0]);

    const [selectedExpression, setSelectedExpression] = useState<string>(expressionTemplates[0]);

    // Body shape state
    const [bodyShape, setBodyShape] = useState<BodyShape>('Sedang');
    const [bustSize, setBustSize] = useState<BustSize>('Medium');
    const [buttocksSize, setButtocksSize] = useState<ButtocksSize>('Medium');
    const [waistSize, setWaistSize] = useState<WaistSize>('Sedang');
    const [height, setHeight] = useState<number>(170);

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoadingGeneration, setIsLoadingGeneration] = useState<boolean>(false);
    const [isImprovingSharpness, setIsImprovingSharpness] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedTemplate(hairTemplates[gender][0]);
    }, [gender]);

    const handleImageUpload = (file: File) => {
        setImageFile(file);
        setCurrentImage(null);
        setHistory([]);
        setError(null);
        setHairOption('main-photo');
        setIsHijab(false);

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setImagePreview(result);
        };
        reader.readAsDataURL(file);
    };

    const handleHairImageUpload = (file: File) => {
        setHairImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setHairImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = useCallback(async () => {
        if (!imagePreview) {
            setError('Please upload a face image first.');
            return;
        }

        let hairDescription = '';
        let hairImageBase64: string | null = null;

        if (isHijab) {
            hairDescription = 'The person is wearing a hijab. You MUST generate a new, simple, plain white hijab for the model, completely replacing any headwear from the original photo. The hijab MUST be solid white.';
        } else {
            switch (hairOption) {
                case 'main-photo':
                    hairDescription = 'The exact same hairstyle, color, and length as in the provided primary photo.';
                    break;
                case 'manual':
                    if (!manualHair.trim()) {
                        setError('Please enter a manual hair description.');
                        return;
                    }
                    hairDescription = manualHair;
                    break;
                case 'template':
                    hairDescription = selectedTemplate;
                    break;
                case 'reference-photo':
                    if (!hairImagePreview) {
                        setError('Please upload a hair reference photo.');
                        return;
                    }
                    hairDescription = '**CRITICAL HAIR INSTRUCTION:** The hairstyle (including color, length, and style) MUST be a 100% EXACT REPLICA of the hairstyle shown in the separate hair reference image. You MUST completely IGNORE the hair from the primary face photo.';
                    hairImageBase64 = hairImagePreview.split(',')[1];
                    break;
            }
        }


        setIsLoadingGeneration(true);
        setError(null);
        setCurrentImage(null);

        try {
            const base64FaceData = imagePreview.split(',')[1];

            const result = await generateModel(
                base64FaceData,
                hairDescription,
                improveFace,
                selectedExpression,
                null, // Age detection is disabled
                gender,
                hairImageBase64,
                bodyShape,
                bustSize,
                buttocksSize,
                waistSize,
                height,
                undefined, // customAttirePrompt - not used in this flow
                isHijab,
                100, // faceSimilarity
                useEnhancedPrompt,
                isCloseUp
            );
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during model generation.');
        } finally {
            setIsLoadingGeneration(false);
        }
    }, [
        imagePreview, hairImagePreview, hairOption, manualHair, selectedTemplate, improveFace,
        selectedExpression, gender, bodyShape, bustSize, buttocksSize, waistSize, height, isHijab, useEnhancedPrompt, isCloseUp
    ]);

    const handleImproveSharpness = useCallback(async () => {
        if (!currentImage) return;

        setIsImprovingSharpness(true);
        setError(null);
        try {
            const base64Data = currentImage.split(',')[1];
            const result = await improveSharpness(base64Data);
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev.filter(img => img !== currentImage)].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during sharpness improvement.');
        } finally {
            setIsImprovingSharpness(false);
        }
    }, [currentImage]);
    
    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                    <FileUpload
                        onImageUpload={handleImageUpload}
                        title="1. Upload Face for Model Creation"
                        description="This is the primary photo for the model's face and identity."
                    />

                    {imageFile && (
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">Subject Details</h3>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
                                    Gender
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setGender('female')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${gender === 'female' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Female</button>
                                    <button onClick={() => setGender('male')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${gender === 'male' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Male</button>
                                </div>
                            </div>
                            <div className="relative flex items-start pt-2">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="improve-face"
                                        aria-describedby="improve-face-description"
                                        name="improve-face"
                                        type="checkbox"
                                        checked={improveFace}
                                        onChange={(e) => setImproveFace(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="improve-face" className="font-medium text-gray-300">
                                        Tune up wajah
                                    </label>
                                    <p id="improve-face-description" className="text-gray-500">
                                        Menghilangkan jerawat, mencerahkan kulit, dan mempertajam detail wajah, mata, alis, dan rambut.
                                    </p>
                                </div>
                            </div>
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="is-hijab"
                                        name="is-hijab"
                                        type="checkbox"
                                        checked={isHijab}
                                        onChange={(e) => setIsHijab(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="is-hijab" className="font-medium text-gray-300">
                                        Subject is wearing a Hijab
                                    </label>
                                    <p id="is-hijab-description" className="text-gray-500">
                                        Generates a white hijab, t-shirt & pants.
                                    </p>
                                </div>
                            </div>
                             <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="use-enhanced-prompt"
                                        name="use-enhanced-prompt"
                                        type="checkbox"
                                        checked={useEnhancedPrompt}
                                        onChange={(e) => setUseEnhancedPrompt(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="use-enhanced-prompt" className="font-medium text-gray-300">
                                        Use Enhanced Prompt
                                    </label>
                                    <p id="use-enhanced-prompt-description" className="text-gray-500">
                                        Adds a detailed prompt for better contrast, detail preservation, and photorealism.
                                    </p>
                                </div>
                            </div>
                            <div className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="is-close-up"
                                        name="is-close-up"
                                        type="checkbox"
                                        checked={isCloseUp}
                                        onChange={(e) => setIsCloseUp(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="is-close-up" className="font-medium text-gray-300">
                                        Generate Close-up Photo
                                    </label>
                                    <p id="is-close-up-description" className="text-gray-500">
                                        Foto postcard setengah badan (perut ke kepala), kualitas profesional dengan detail kulit super realistis.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {imageFile && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-cyan-400 flex items-center gap-2"><CustomizeIcon className="w-5 h-5" /> 2. Configure Model</h2>
                            <ControlPanel
                                imageUploaded={!!imageFile}
                                hairOption={hairOption}
                                setHairOption={setHairOption}
                                manualHair={manualHair}
                                setManualHair={setManualHair}
                                selectedTemplate={selectedTemplate}
                                setSelectedTemplate={setSelectedTemplate}
                                gender={gender}
                                selectedExpression={selectedExpression}
                                setSelectedExpression={setSelectedExpression}
                                onHairImageUpload={handleHairImageUpload}
                                hairImagePreview={hairImagePreview}
                                bodyShape={bodyShape}
                                setBodyShape={setBodyShape}
                                bustSize={bustSize}
                                setBustSize={setBustSize}
                                buttocksSize={buttocksSize}
                                setButtocksSize={setButtocksSize}
                                waistSize={waistSize}
                                setWaistSize={setWaistSize}
                                height={height}
                                setHeight={setHeight}
                                isChildDetected={false}
                                isCloseUp={isCloseUp}
                            />
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={!imageFile || isLoadingGeneration}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                    >
                        {isLoadingGeneration ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                        {isLoadingGeneration ? 'Generating...' : 'Generate Model'}
                    </button>
                </div>

                {/* Right Column: Output */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Original Photo</h3>
                            {imagePreview ? (
                                <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                                    <img src={imagePreview} alt="Uploaded face preview" className="rounded-md max-w-full max-h-full object-contain shadow-lg" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                                    <PhotoIcon className="w-16 h-16 mb-4" />
                                    <p>Your uploaded photo will appear here.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <ImageDisplay
                                imageUrl={currentImage}
                                isLoading={isLoadingGeneration}
                                onRegenerate={handleGenerate}
                                onImproveSharpness={handleImproveSharpness}
                                isImprovingSharpness={isImprovingSharpness}
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
        </>
    );
};

export default ModelCreator;