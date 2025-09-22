import React, { useState, useCallback, useEffect } from 'react';
import { generateModel, improveSharpness, detectAgeCategory } from '../services/geminiService';
import FileUpload from './FileUpload';
import ControlPanel from './ControlPanel';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, BrainIcon, GenerateIcon, SparklesIcon as CustomizeIcon } from './icons';
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


    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoadingGeneration, setIsLoadingGeneration] = useState<boolean>(false);
    const [isImprovingSharpness, setIsImprovingSharpness] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [detectedAgeCategory, setDetectedAgeCategory] = useState<string | null>(null);
    const [isDetectingAge, setIsDetectingAge] = useState<boolean>(false);

    useEffect(() => {
        setSelectedTemplate(hairTemplates[gender][0]);
    }, [gender]);

    useEffect(() => {
        if (detectedAgeCategory === 'Baby' || detectedAgeCategory === 'Child') {
            setBustSize('Small');
            setButtocksSize('Small');
            setWaistSize('Sedang');
        }
    }, [detectedAgeCategory]);

    const runAgeDetection = useCallback(async (base64Data: string) => {
        setIsDetectingAge(true);
        setDetectedAgeCategory(null);
        try {
            const category = await detectAgeCategory(base64Data);
            setDetectedAgeCategory(category);
        } catch (err) {
            console.error("Age detection failed:", err);
            setDetectedAgeCategory("Detection failed");
        } finally {
            setIsDetectingAge(false);
        }
    }, []);

    const handleImageUpload = (file: File) => {
        setImageFile(file);
        setGeneratedImage(null);
        setError(null);
        setHairOption('main-photo');
        setDetectedAgeCategory(null);
        setIsHijab(false);

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setImagePreview(result);
            const base64Data = result.split(',')[1];
            runAgeDetection(base64Data);
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
        setGeneratedImage(null);

        try {
            const base64FaceData = imagePreview.split(',')[1];

            const result = await generateModel(
                base64FaceData,
                hairDescription,
                improveFace,
                selectedExpression,
                detectedAgeCategory,
                gender,
                hairImageBase64,
                bodyShape,
                bustSize,
                buttocksSize,
                waistSize,
                height,
                undefined, // customAttirePrompt - not used in this flow
                isHijab,
                95, // faceSimilarity
                useEnhancedPrompt
            );
            setGeneratedImage(`data:image/jpeg;base64,${result}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during model generation.');
        } finally {
            setIsLoadingGeneration(false);
        }
    }, [
        imagePreview, hairImagePreview, hairOption, manualHair, selectedTemplate, improveFace,
        selectedExpression, detectedAgeCategory, gender, bodyShape, bustSize, buttocksSize, waistSize, height, isHijab, useEnhancedPrompt
    ]);

    const handleImproveSharpness = useCallback(async () => {
        if (!generatedImage) return;

        setIsImprovingSharpness(true);
        setError(null);
        try {
            const base64Data = generatedImage.split(',')[1];
            const result = await improveSharpness(base64Data);
            setGeneratedImage(`data:image/jpeg;base64,${result}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during sharpness improvement.');
        } finally {
            setIsImprovingSharpness(false);
        }
    }, [generatedImage]);
    
    const isChildDetected = detectedAgeCategory === 'Baby' || detectedAgeCategory === 'Child';

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
                        <div className="p-4 bg-gray-900/50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-200 mb-2 flex items-center gap-2">
                                <BrainIcon className="w-5 h-5 text-cyan-400" />
                                Automated Analysis
                            </h3>
                            <div className="grid grid-cols-2 gap-x-4">
                                <div>
                                    {isDetectingAge ? (
                                        <div className="flex items-center text-gray-400 text-sm">
                                            <Spinner />
                                            <span className="ml-2">Detecting Age...</span>
                                        </div>
                                    ) : (
                                        <p className="text-gray-300 text-sm">
                                            Detected Age: <span className="font-bold text-white">{detectedAgeCategory || 'N/A'}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

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
                                        Improve Face
                                    </label>
                                    <p id="improve-face-description" className="text-gray-500">
                                        Enhance sharpness, brightness, and remove blemishes.
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
                                isChildDetected={isChildDetected}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
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
                                imageUrl={generatedImage}
                                isLoading={isLoadingGeneration}
                                onRegenerate={handleGenerate}
                                onImproveSharpness={handleImproveSharpness}
                                isImprovingSharpness={isImprovingSharpness}
                                error={error}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ModelCreator;