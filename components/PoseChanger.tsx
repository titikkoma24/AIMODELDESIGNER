import React, { useState, useCallback, useEffect } from 'react';
import { changePose, changeBackground, translateText, analyzePose, improvePrompt, getFriendlyErrorMessage } from '../services/geminiService';
import { shotStyles, lightStyles, aspectRatios } from '../constants/backgroundTemplates';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import Spinner from './Spinner';
import { PhotoIcon, BrainIcon, GenerateIcon, XMarkIcon, SparklesIcon } from './icons';

type ModelInput = {
    file: File | null;
    preview: string | null;
    gender: 'female' | 'male';
};

const PoseChanger: React.FC = () => {
    const [numberOfModels, setNumberOfModels] = useState<number>(1);
    const [models, setModels] = useState<ModelInput[]>(() => Array(6).fill({ file: null, preview: null, gender: 'female' }));
    const [poseImage, setPoseImage] = useState<{ file: File; preview: string } | null>(null);

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [poseMode, setPoseMode] = useState<'image' | 'text'>('image');
    const [objects, setObjects] = useState<{ file: File; preview: string }[]>([]);
    const [posePrompt, setPosePrompt] = useState<string>('A model standing confidently, holding a red handbag.');
    const [isTranslating, setIsTranslating] = useState<boolean>(false);

    const [isAnalyzingPose, setIsAnalyzingPose] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [isPoseFromAnalysis, setIsPoseFromAnalysis] = useState<boolean>(false);

    const [backgroundPrompt, setBackgroundPrompt] = useState<string>('A hyperrealistic sun-drenched beach with turquoise water and white sand.');
    const [selectedShotStyleBG, setSelectedShotStyleBG] = useState<string>(shotStyles[0]);
    const [selectedLightStyleBG, setSelectedLightStyleBG] = useState<string>(lightStyles[0].name);
    const [changeDresscode, setChangeDresscode] = useState<boolean>(false);
    const [isChangingBackground, setIsChangingBackground] = useState<boolean>(false);
    const [backgroundError, setBackgroundError] = useState<string | null>(null);
    const [isImprovingPrompt, setIsImprovingPrompt] = useState<boolean>(false);
    const [isTranslatingBackground, setIsTranslatingBackground] = useState<boolean>(false);
    const [backgroundLightStyleDescription, setBackgroundLightStyleDescription] = useState<string>('');

    const [poseReferenceType, setPoseReferenceType] = useState<'realistic' | 'sketch'>('realistic');
    const [aspectRatio, setAspectRatio] = useState<string>(aspectRatios[0]);
    const [isAspectRatioLocked, setIsAspectRatioLocked] = useState<boolean>(true);
    const [useLightingStyle, setUseLightingStyle] = useState<boolean>(false);
    const [selectedLightingStyle, setSelectedLightingStyle] = useState<string>(lightStyles[0].name);
    const [poseLightingStyleDescription, setPoseLightingStyleDescription] = useState<string>('');
    const [useShotStyle, setUseShotStyle] = useState<boolean>(false);
    const [selectedShotStyle, setSelectedShotStyle] = useState<string>(shotStyles[0]);
    const [faceSimilarity, setFaceSimilarity] = useState<number>(95);

    useEffect(() => {
        const selectedStyle = lightStyles.find(style => style.name === selectedLightingStyle);
        setPoseLightingStyleDescription(selectedStyle ? selectedStyle.description : '');
    }, [selectedLightingStyle]);

    useEffect(() => {
        const selectedStyle = lightStyles.find(style => style.name === selectedLightStyleBG);
        setBackgroundLightStyleDescription(selectedStyle ? selectedStyle.description : '');
    }, [selectedLightStyleBG]);


    const handleModelUpload = (file: File, index: number) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setModels(prevModels => {
                const newModels = [...prevModels];
                newModels[index] = { ...newModels[index], file, preview: reader.result as string };
                return newModels;
            });
            setCurrentImage(null);
            setHistory([]);
            setError(null);
            setBackgroundError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleGenderChange = (gender: 'female' | 'male', index: number) => {
        setModels(prevModels => {
            const newModels = [...prevModels];
            newModels[index] = { ...newModels[index], gender };
            return newModels;
        });
    };

    const handlePoseImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPoseImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setCurrentImage(null);
        setError(null);
    };

    const handleObjectUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setObjects(prev => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
    };

    const removeObject = (indexToRemove: number) => {
        setObjects(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handlePosePromptChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setIsPoseFromAnalysis(false);
        const newPrompt = e.target.value;
        setPosePrompt(newPrompt);

        let translationConfig: { trigger: string; lang: string; } | null = null;
        if (newPrompt.endsWith('.,')) {
            translationConfig = { trigger: '.,', lang: 'Indonesian' };
        } else if (newPrompt.endsWith('..')) {
            translationConfig = { trigger: '..', lang: 'English' };
        }

        if (translationConfig) {
            const textToTranslate = newPrompt.slice(0, -translationConfig.trigger.length);
            if (!textToTranslate.trim()) {
                setPosePrompt('');
                return;
            }

            setIsTranslating(true);
            setError(null);
            try {
                const translatedText = await translateText(textToTranslate, translationConfig.lang);
                setPosePrompt(translatedText);
            } catch (err) {
                console.error('Translation failed:', err);
                setError(getFriendlyErrorMessage(err));
                setPosePrompt(textToTranslate);
            } finally {
                setIsTranslating(false);
            }
        }
    };

    const handleBackgroundPromptChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newPrompt = e.target.value;
        setBackgroundPrompt(newPrompt);

        let translationConfig: { trigger: string; lang: string; } | null = null;
        if (newPrompt.endsWith('.,')) {
            translationConfig = { trigger: '.,', lang: 'Indonesian' };
        } else if (newPrompt.endsWith('..')) {
            translationConfig = { trigger: '..', lang: 'English' };
        }

        if (translationConfig) {
            const textToTranslate = newPrompt.slice(0, -translationConfig.trigger.length);
            if (!textToTranslate.trim()) {
                setBackgroundPrompt('');
                return;
            }

            setIsTranslatingBackground(true);
            setBackgroundError(null);
            try {
                const translatedText = await translateText(textToTranslate, translationConfig.lang);
                setBackgroundPrompt(translatedText);
            } catch (error) {
                console.error('Translation failed:', error);
                setBackgroundError(getFriendlyErrorMessage(error));
                setBackgroundPrompt(textToTranslate);
            } finally {
                setIsTranslatingBackground(false);
            }
        }
    };

    const handleImproveBackgroundPrompt = useCallback(async () => {
        if (!backgroundPrompt.trim()) return;
        setIsImprovingPrompt(true);
        setBackgroundError(null);
        try {
            const improved = await improvePrompt(backgroundPrompt);
            setBackgroundPrompt(improved);
        } catch (err) {
            setBackgroundError(getFriendlyErrorMessage(err));
        } finally {
            setIsImprovingPrompt(false);
        }
    }, [backgroundPrompt]);

    const handlePoseModeChange = (mode: 'image' | 'text') => {
        setPoseMode(mode);
        setError(null);
        setCurrentImage(null);
        setIsPoseFromAnalysis(false);
        if (mode === 'image') {
            setObjects([]);
            setPosePrompt('A model standing confidently, holding a red handbag.');
        } else {
            setPoseImage(null);
        }
    };

    const handleAnalyzeReferencePose = useCallback(async () => {
        if (!poseImage) {
            setAnalysisError("Please upload a pose reference image to analyze.");
            return;
        }

        setIsAnalyzingPose(true);
        setAnalysisError(null);
        setError(null);

        try {
            const base64Image = poseImage.preview.split(',')[1];
            let analysisResult = await analyzePose(base64Image);

            const enhancementPrompt = " *pastikan tidak merubah detail wajah ataupun rambut sedikitpun,pertahankan 100% kemiripannya dari referensi photo yang diunggah/dilampirkan. buat sangat realistis dengan detail tajam.kontras tinggi. seolah-olah diambil menggunakan kamera DSLR lensa terbaik.";
            
            const finalPrompt = analysisResult + enhancementPrompt;

            setPosePrompt(finalPrompt);
            setPoseMode('text');
            setObjects([]);
            setIsPoseFromAnalysis(true);
        } catch (err) {
            setAnalysisError(getFriendlyErrorMessage(err));
        } finally {
            setIsAnalyzingPose(false);
        }
    }, [poseImage]);

    const handleGenerate = useCallback(async () => {
        const activeModels = models.slice(0, numberOfModels);
        if (activeModels.some(m => !m.file)) {
            setError(`Please upload photos for all ${numberOfModels} people.`);
            return;
        }

        if (poseMode === 'image' && !poseImage) {
            setError("Please upload a pose reference image.");
            return;
        }

        if (poseMode === 'text' && !posePrompt.trim()) {
            setError("Please enter a pose description.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setCurrentImage(null);
        setBackgroundError(null);

        try {
            const getBase64 = (fileOrPreview: File | string): Promise<string> => new Promise((resolve, reject) => {
                 if (typeof fileOrPreview === 'string') {
                    resolve(fileOrPreview.split(',')[1]);
                    return;
                }
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(fileOrPreview);
            });

            const modelInputs = await Promise.all(
              activeModels.map(async (model) => ({
                imageBase64: await getBase64(model.preview!),
                gender: model.gender,
              }))
            );
            
            let poseConfig;
            if (poseMode === 'image' && poseImage) {
                const poseImageBase64 = await getBase64(poseImage.preview);
                poseConfig = { mode: 'image' as 'image', poseImageBase64, poseReferenceType };
            } else {
                const objectImagesBase64 = await Promise.all(objects.map(obj => getBase64(obj.file!)));
                poseConfig = { mode: 'text' as 'text', posePrompt, objectImagesBase64 };
            }

            const result = await changePose(
                modelInputs,
                poseConfig, 
                {
                    aspectRatio,
                    isAspectRatioLocked,
                    lightingStyle: useLightingStyle ? selectedLightingStyle : undefined,
                    shotStyle: useShotStyle ? selectedShotStyle : undefined,
                },
                faceSimilarity
            );
            
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));

        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [models, numberOfModels, poseImage, poseMode, posePrompt, objects, poseReferenceType, aspectRatio, isAspectRatioLocked, useLightingStyle, selectedLightingStyle, useShotStyle, selectedShotStyle, faceSimilarity]);
    
    const handleChangeBackground = useCallback(async () => {
        if (!currentImage) {
            setBackgroundError("There is no generated image to change the background of.");
            return;
        }
        if (!backgroundPrompt.trim()) {
            setBackgroundError("Please provide a description for the new background.");
            return;
        }

        setIsChangingBackground(true);
        setBackgroundError(null);
        setError(null);

        try {
            const base64Image = currentImage.split(',')[1];
            const result = await changeBackground(
                [base64Image], 
                backgroundPrompt, 
                selectedShotStyleBG, 
                selectedLightStyleBG, 
                aspectRatio, 
                isAspectRatioLocked
            );
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setBackgroundError(getFriendlyErrorMessage(err));
        } finally {
            setIsChangingBackground(false);
        }

    }, [currentImage, backgroundPrompt, selectedShotStyleBG, selectedLightStyleBG, changeDresscode, aspectRatio, isAspectRatioLocked]);

    const activeModels = models.slice(0, numberOfModels);
    const canGenerate = !isLoading && activeModels.every(m => m.file) && (poseMode === 'text' ? !!posePrompt.trim() : !!poseImage);
    const canChangeBackground = !!currentImage && !isLoading && !isChangingBackground;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                
                <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold text-gray-200">1. Upload Models</h3>
                     <label htmlFor="number-of-models" className="block text-sm font-medium text-gray-300">
                        How many people in the photo?
                    </label>
                    <select
                        id="number-of-models"
                        value={numberOfModels}
                        onChange={(e) => setNumberOfModels(Number(e.target.value))}
                        className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: numberOfModels }).map((_, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3 bg-gray-900/50 rounded-lg">
                          <h4 className="font-semibold text-gray-300 text-sm">Person {index + 1}</h4>
                           <div className="flex-grow">
                               {models[index]?.preview ? (
                                    <div className="relative group aspect-w-1 aspect-h-1">
                                        <img src={models[index].preview!} alt={`Model ${index + 1}`} className="rounded-md w-full h-full object-cover"/>
                                        <div 
                                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={() => document.getElementById(`model-upload-${index}`)?.click()}
                                        >
                                            <p className="text-white text-xs text-center">Click to replace</p>
                                            <input
                                                id={`model-upload-${index}`}
                                                type="file"
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/webp"
                                                onChange={(e) => e.target.files && handleModelUpload(e.target.files[0], index)}
                                            />
                                        </div>
                                    </div>
                               ) : (
                                  <FileUpload
                                      onImageUpload={(file) => handleModelUpload(file, index)}
                                      title=""
                                      description=""
                                  />
                              )}
                           </div>
                          <div className="grid grid-cols-2 gap-2 mt-auto">
                              <button onClick={() => handleGenderChange('female', index)} className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${models[index]?.gender === 'female' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Female</button>
                              <button onClick={() => handleGenderChange('male', index)} className={`w-full py-1.5 text-xs font-medium rounded-md transition-colors ${models[index]?.gender === 'male' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Male</button>
                          </div>
                      </div>
                  ))}
                </div>


                <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
                    <h3 className="text-lg font-semibold text-gray-200">2. Select Pose Mode</h3>
                     <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handlePoseModeChange('image')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${poseMode === 'image' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>From Image</button>
                      <button onClick={() => handlePoseModeChange('text')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${poseMode === 'text' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Prompt Tex Manual</button>
                    </div>
                </div>

                {poseMode === 'image' ? (
                     <div className="space-y-4">
                        <FileUpload
                            onImageUpload={handlePoseImageUpload}
                            title="3. Upload Pose Reference"
                            description="Upload a photo or sketch of the desired pose."
                        />
                         <div className="p-4 bg-gray-900/50 rounded-lg space-y-3">
                            <h3 className="text-lg font-semibold text-gray-200">Reference Type</h3>
                            <p className="text-sm text-gray-400">Is your reference a photo or a sketch?</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => setPoseReferenceType('realistic')} 
                                    className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${poseReferenceType === 'realistic' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    Realistic Photo
                                </button>
                                <button 
                                    onClick={() => setPoseReferenceType('sketch')} 
                                    className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${poseReferenceType === 'sketch' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                                >
                                    Sketch Photo
                                </button>
                            </div>
                        </div>
                        {poseImage && (
                            <div className="mt-2">
                                <button
                                    onClick={handleAnalyzeReferencePose}
                                    disabled={isAnalyzingPose}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                                >
                                    {isAnalyzingPose ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                                    {isAnalyzingPose ? 'Analyzing...' : 'AI Analysis Pose'}
                                </button>
                                {analysisError && (
                                    <p className="text-red-400 text-xs mt-2 text-center">{analysisError}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-2 text-center">Analyzes the pose and converts it into a detailed text prompt for generation.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-200">3. Describe Pose</h3>
                        <div>
                            <label htmlFor="pose-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                                Pose Description
                            </label>
                            <p className="text-gray-400 text-xs mb-2">Add `..` to translate to English, or `.,` to translate to Indonesian.</p>
                             <div className="relative">
                                <textarea
                                    id="pose-prompt"
                                    rows={4}
                                    value={posePrompt}
                                    onChange={handlePosePromptChange}
                                    disabled={isTranslating}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:cursor-not-allowed resize-none"
                                    placeholder="e.g., A couple standing together, holding hands..."
                                />
                                {isTranslating && (
                                    <div className="absolute inset-0 bg-gray-700/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                        <Spinner />
                                        <span className="ml-3 text-gray-200">Translating...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!isPoseFromAnalysis && (
                            <>
                                <FileUpload
                                    onImageUpload={handleObjectUpload}
                                    title="Optional: Upload Objects"
                                    description="Upload objects for the model to interact with."
                                />
                                {objects.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {objects.map((obj, index) => (
                                            <div key={index} className="relative group">
                                                <img src={obj.preview} alt={`Object ${index + 1}`} className="rounded-md w-full h-full object-cover"/>
                                                <button 
                                                    onClick={() => removeObject(index)}
                                                    className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Remove object"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold text-gray-200">4. Output Settings</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex-grow">
                            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                            <select
                                id="aspect-ratio"
                                value={aspectRatio}
                                onChange={(e) => setAspectRatio(e.target.value)}
                                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                            >
                                {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                            </select>
                        </div>
                        <div className="relative flex items-start pt-7">
                            <div className="flex h-6 items-center">
                                <input
                                    id="lock-aspect-ratio"
                                    type="checkbox"
                                    checked={isAspectRatioLocked}
                                    onChange={(e) => setIsAspectRatioLocked(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="lock-aspect-ratio" className="font-medium text-gray-300">
                                    Lock
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="face-similarity-pose" className="block text-sm font-medium text-gray-300 mb-2">
                            Face Similarity ({faceSimilarity}%)
                        </label>
                        <input
                            id="face-similarity-pose"
                            type="range"
                            min="70"
                            max="100"
                            value={faceSimilarity}
                            onChange={(e) => setFaceSimilarity(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <p className="text-xs text-gray-400 mt-2">Controls how closely generated faces resemble the uploaded photos.</p>
                    </div>
                    <div>
                        <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                                <input id="use-shot-style" type="checkbox" checked={useShotStyle} onChange={(e) => setUseShotStyle(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"/>
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="use-shot-style" className="font-medium text-gray-300">Use Shot Style</label>
                            </div>
                        </div>
                        {useShotStyle && (
                            <select
                                id="shot-style"
                                value={selectedShotStyle}
                                onChange={(e) => setSelectedShotStyle(e.target.value)}
                                className="w-full px-3 py-2 mt-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                            >
                                {shotStyles.map(style => <option key={style} value={style}>{style}</option>)}
                            </select>
                        )}
                    </div>
                    <div>
                        <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                                <input id="use-lighting-style" type="checkbox" checked={useLightingStyle} onChange={(e) => setUseLightingStyle(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"/>
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="use-lighting-style" className="font-medium text-gray-300">Use Lighting Style</label>
                            </div>
                        </div>
                        {useLightingStyle && (
                            <div className="mt-2">
                                <select
                                    id="light-style"
                                    value={selectedLightingStyle}
                                    onChange={(e) => setSelectedLightingStyle(e.target.value)}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    {lightStyles.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                                </select>
                                {poseLightingStyleDescription && <p className="text-xs text-gray-400 mt-2">{poseLightingStyleDescription}</p>}
                            </div>
                        )}
                    </div>
                </div>
                
                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                    {isLoading ? 'Generating Pose...' : 'Change Pose'}
                </button>
            </div>

            {/* Right Column: Previews & Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Inputs</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {activeModels.map((model, index) => model.preview ? (
                                    <img key={index} src={model.preview} alt={`Model ${index+1} preview`} className="rounded-md w-full object-contain shadow-lg" />
                                ): null)}
                            </div>
                            {poseMode === 'image' && (
                                <>
                                {poseImage ? (
                                    <img src={poseImage.preview} alt="Pose preview" className="rounded-md w-full object-contain shadow-lg" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-48 text-center text-gray-500 bg-gray-900/50 rounded-lg p-4">
                                        <PhotoIcon className="w-12 h-12 mb-2" />
                                        <p>Pose Reference</p>
                                    </div>
                                )}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col">
                         <ImageDisplay
                            imageUrl={currentImage}
                            isLoading={isLoading || isChangingBackground}
                            onRegenerate={handleGenerate}
                            isStandalone={true}
                            title="Generated Pose"
                            error={error || backgroundError}
                        />
                    </div>
                </div>

                 {/* --- New Background Change Section --- */}
                {currentImage && !isLoading && (
                    <div className="mt-6 pt-6 border-t border-gray-700 space-y-4">
                        <h3 className="text-xl font-semibold text-cyan-400">Change Background</h3>
                        <div>
                            <label htmlFor="background-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                                1. Describe the background
                            </label>
                            <p className="text-gray-400 text-xs mb-2">Add `..` to translate to English, or `.,` to translate to Indonesian.</p>
                             <div className="relative">
                                <textarea
                                    id="background-prompt"
                                    rows={3}
                                    value={backgroundPrompt}
                                    onChange={handleBackgroundPromptChange}
                                    disabled={!canChangeBackground || isTranslatingBackground || isImprovingPrompt}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:cursor-not-allowed resize-none"
                                    placeholder="e.g., A futuristic city skyline at night with neon lights..."
                                />
                                {(isTranslatingBackground || isImprovingPrompt) && (
                                    <div className="absolute inset-0 bg-gray-700/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                        <Spinner />
                                        <span className="ml-3 text-gray-200">{isTranslatingBackground ? 'Translating...' : 'Improving...'}</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleImproveBackgroundPrompt}
                                disabled={!backgroundPrompt.trim() || isImprovingPrompt || !canChangeBackground}
                                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                            >
                                {isImprovingPrompt ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                                {isImprovingPrompt ? 'Improving...' : 'AI Improvement'}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="shot-style-bg" className="block text-sm font-medium text-gray-300 mb-2">2. Shot Style</label>
                                <select
                                    id="shot-style-bg"
                                    value={selectedShotStyleBG}
                                    onChange={(e) => setSelectedShotStyleBG(e.target.value)}
                                    disabled={!canChangeBackground}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:cursor-not-allowed"
                                >
                                    {shotStyles.map(style => <option key={style} value={style}>{style}</option>)}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="light-style-bg" className="block text-sm font-medium text-gray-300 mb-2">3. Light Style</label>
                                <select
                                    id="light-style-bg"
                                    value={selectedLightStyleBG}
                                    onChange={(e) => setSelectedLightStyleBG(e.target.value)}
                                    disabled={!canChangeBackground}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 disabled:cursor-not-allowed"
                                >
                                    {lightStyles.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                                </select>
                                {backgroundLightStyleDescription && <p className="text-xs text-gray-400 mt-2">{backgroundLightStyleDescription}</p>}
                            </div>
                        </div>
                        <div className="relative flex items-start pt-2">
                            <div className="flex h-6 items-center">
                                <input
                                    id="change-dresscode-pose"
                                    name="change-dresscode"
                                    type="checkbox"
                                    checked={changeDresscode}
                                    onChange={(e) => setChangeDresscode(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                                <label htmlFor="change-dresscode-pose" className="font-medium text-gray-300">
                                    Ganti Baju & Perbaiki Pose
                                </label>
                                <p id="change-dresscode-description-pose" className="text-gray-500">
                                    Izinkan AI untuk mengganti pakaian, memperbaiki pose, dan ekspresi agar sesuai dengan latar baru. Wajah akan tetap sama.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleChangeBackground}
                            disabled={!canChangeBackground}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
                        >
                            {isChangingBackground ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                            {isChangingBackground ? 'Changing Background...' : 'Change Background'}
                        </button>
                    </div>
                )}

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
export default PoseChanger;