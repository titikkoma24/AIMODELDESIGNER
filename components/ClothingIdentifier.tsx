import React, { useState, useCallback, useEffect } from 'react';
import { identifyClothing, generateModel, detectAgeCategory, translateText, getFriendlyErrorMessage } from '../services/geminiService';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, BrainIcon, GenerateIcon, UserCircleIcon } from './icons';
import Spinner from './Spinner';
import { ClothingAnalysis } from '../types';
import { poseTemplates } from '../constants/hairTemplates';

const ClothingIdentifier: React.FC = () => {
    const [fullDress, setFullDress] = useState<{ file: File; preview: string } | null>(null);
    const [top, setTop] = useState<{ file: File; preview: string } | null>(null);
    const [bottoms, setBottoms] = useState<{ file: File; preview: string } | null>(null);
    const [footwear, setFootwear] = useState<{ file: File; preview: string } | null>(null);
    
    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [analysis, setAnalysis] = useState<ClothingAnalysis | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    // --- New State for Model Generation ---
    const [faceForModel, setFaceForModel] = useState<{ file: File; preview: string } | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [currentModelImage, setCurrentModelImage] = useState<string | null>(null);
    const [modelHistory, setModelHistory] = useState<string[]>([]);
    const [isGeneratingModel, setIsGeneratingModel] = useState<boolean>(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [modelGender, setModelGender] = useState<'female' | 'male'>('female');
    const [faceSimilarity, setFaceSimilarity] = useState<number>(95);
    const [useEnhancedPrompt, setUseEnhancedPrompt] = useState<boolean>(true);
    const [selectedPose, setSelectedPose] = useState<string>(poseTemplates.female[0]);


    const [isTranslating, setIsTranslating] = useState<boolean>(false);


    useEffect(() => {
        if (analysis) {
            const createSwapPrompt = (analysisResult: ClothingAnalysis): string => {
                const parts: string[] = [];
                if (analysisResult.fullOutfit) {
                    parts.push(analysisResult.fullOutfit);
                } else {
                    if (analysisResult.top) parts.push(analysisResult.top);
                    if (analysisResult.bottoms) parts.push(analysisResult.bottoms);
                    if (analysisResult.footwear) parts.push(analysisResult.footwear);
                }
                if (analysisResult.accessories) {
                    parts.push(analysisResult.accessories);
                }

                const clothingDescription = parts.filter(p => p && p.trim() !== '').join(', ');
                
                const finalClothingPrompt = clothingDescription 
                    ? `A model wearing: ${clothingDescription}.`
                    : "A model wearing a simple outfit.";
                
                const posePrompt = selectedPose !== 'Pose Berdiri Alami (Default)' 
                    ? `A model in a '${selectedPose}' pose. ` 
                    : '';

                const specialInstruction = "pastikan tidak merubah detail wajah ataupun rambut sedikitpun, pertahankan 100% kemiripannya dari referensi photo yang diunggah/dilampirkan. buat sangat realistis dengan detail tajam.kontras tinggi. seolah-olah diambil menggunakan kamera DSLR lensa terbaik.";
                
                return `${posePrompt}${finalClothingPrompt} ${specialInstruction}`;
            };
            setGeneratedPrompt(createSwapPrompt(analysis));
            setCurrentModelImage(null); // Reset image when new analysis is done
        }
    }, [analysis, selectedPose]);

    useEffect(() => {
        setSelectedPose(poseTemplates[modelGender][0]);
    }, [modelGender]);


    const handleFileUpload = (file: File, setter: React.Dispatch<React.SetStateAction<{ file: File; preview: string } | null>>) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setter({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleFullDressUpload = (file: File) => {
        handleFileUpload(file, setFullDress);
        setTop(null);
        setBottoms(null);
        setFootwear(null);
        setAnalysis(null);
        setAnalysisError(null);
        setFaceForModel(null);
    };

    const handleItemUpload = (file: File, setter: React.Dispatch<React.SetStateAction<{ file: File; preview: string } | null>>) => {
        handleFileUpload(file, setter);
        setAnalysis(null);
        setAnalysisError(null);
        setFaceForModel(null);
    }
    
    const handleFaceUpload = (file: File) => {
        handleFileUpload(file, setFaceForModel);
        setCurrentModelImage(null);
        setModelHistory([]);
        setGenerationError(null);
    };

    const handleAnalyze = useCallback(async () => {
        const hasFullDress = !!fullDress;
        const hasItems = !!top || !!bottoms || !!footwear;

        if (!hasFullDress && !hasItems) {
            setAnalysisError("Please upload at least one image to analyze.");
            return;
        }

        setIsLoadingAnalysis(true);
        setAnalysisError(null);
        setAnalysis(null);
        setFaceForModel(null);
        setCurrentModelImage(null);

        try {
            const getBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(file);
                });
            };
            
            const imagesToAnalyze: { fullDress?: string; top?: string; bottoms?: string; footwear?: string; } = {};

            if (fullDress) {
                imagesToAnalyze.fullDress = await getBase64(fullDress.file);
            } else {
                if (top) imagesToAnalyze.top = await getBase64(top.file);
                if (bottoms) imagesToAnalyze.bottoms = await getBase64(bottoms.file);
                if (footwear) imagesToAnalyze.footwear = await getBase64(footwear.file);
            }
            
            const result = await identifyClothing(imagesToAnalyze);
            setAnalysis(result);

        // FIX: Corrected syntax from `catch (err) =>` to `catch (err)`. The fat arrow `=>` is invalid in a catch block and was causing a cascade of compiler errors.
        } catch (err) {
            setAnalysisError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoadingAnalysis(false);
        }
    }, [fullDress, top, bottoms, footwear]);

    const handleGenerateModelWithClothing = useCallback(async () => {
        if (!faceForModel) {
            setGenerationError("Please upload a face to generate the model.");
            return;
        }

        setIsGeneratingModel(true);
        setGenerationError(null);
        setCurrentModelImage(null);

        try {
            const base64FaceData = faceForModel.preview.split(',')[1];
            // We run age detection to ensure child safety rules are applied.
            const ageCategory = await detectAgeCategory(base64FaceData);

            // FIX: The `generateModel` call was missing the `height` argument and incorrectly passing `generatedPrompt` in its place.
            // A default height of 170 is now provided, and `generatedPrompt` is correctly passed as `customAttirePrompt`.
            const result = await generateModel(
                base64FaceData,
                'The exact same hairstyle, color, and length as in the provided primary photo.', // Default hair
                false, // Default improve face
                'Natural Smile', // Default expression
                ageCategory,
                modelGender,
                null, // No hair reference image
                'Sedang', // Default body shape
                'Medium', // Default bust
                'Medium', // Default buttocks
                'Sedang', // Default waist size
                170, // Default height
                generatedPrompt, // Use the dynamically generated attire prompt
                undefined, // isHijab
                faceSimilarity,
                useEnhancedPrompt
            );
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentModelImage(newImage);
            setModelHistory(prev => [newImage, ...prev].slice(0, 10));

        // FIX: Corrected syntax from `catch (err) =>` to `catch (err)`. The fat arrow `=>` is invalid in a catch block.
        } catch (err) {
            setGenerationError(getFriendlyErrorMessage(err));
        } finally {
            setIsGeneratingModel(false);
        }
    }, [faceForModel, modelGender, generatedPrompt, faceSimilarity, useEnhancedPrompt]);

    const handlePromptChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newPrompt = e.target.value;
        setGeneratedPrompt(newPrompt);

        let translationConfig: { trigger: string; lang: string; } | null = null;
        if (newPrompt.endsWith('.,')) {
            translationConfig = { trigger: '.,', lang: 'Indonesian' };
        } else if (newPrompt.endsWith('..')) {
            translationConfig = { trigger: '..', lang: 'English' };
        }

        if (translationConfig) {
            const textToTranslate = newPrompt.slice(0, -translationConfig.trigger.length);
            if (!textToTranslate.trim()) {
                setGeneratedPrompt('');
                return;
            }

            setIsTranslating(true);
            setGenerationError(null); 
            try {
                const translatedText = await translateText(textToTranslate, translationConfig.lang);
                setGeneratedPrompt(translatedText);
            } catch (error) {
                console.error('Translation failed:', error);
                setGenerationError(getFriendlyErrorMessage(error));
                setGeneratedPrompt(textToTranslate); 
            } finally {
                setIsTranslating(false);
            }
        }
    };

    const renderPreview = (item: { preview: string } | null, title: string) => (
        <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">{title}</h3>
            <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center min-h-[150px]">
                {item ? (
                     <img src={item.preview} alt={`${title} preview`} className="rounded-md max-w-full max-h-48 object-contain shadow-lg" />
                ) : (
                    <div className="text-center text-gray-500">
                        <PhotoIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Upload an image</p>
                    </div>
                )}
            </div>
        </div>
    );
    
    const isItemsDisabled = !!fullDress;
    const canAnalyze = !isLoadingAnalysis && (!!fullDress || !!top || !!bottoms || !!footwear);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                    <FileUpload 
                        onImageUpload={handleFullDressUpload}
                        title="1. Upload Full Outfit"
                        description="Analyzes the entire outfit and disables individual item uploads below."
                    />
                    
                    <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-gray-600" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-gray-800/50 px-3 text-base font-semibold leading-6 text-gray-400 backdrop-blur-sm rounded-full">OR</span>
                        </div>
                    </div>

                    <div className={`space-y-4 ${isItemsDisabled ? 'opacity-50' : ''}`}>
                        <FileUpload
                            onImageUpload={(file) => handleItemUpload(file, setTop)}
                            title="2. Upload Top"
                            description="e.g., T-shirt, blouse, jacket."
                            disabled={isItemsDisabled}
                        />
                        <FileUpload
                            onImageUpload={(file) => handleItemUpload(file, setBottoms)}
                            title="3. Upload Bottoms"
                            description="e.g., Pants, skirt, shorts."
                            disabled={isItemsDisabled}
                        />
                        <FileUpload
                            onImageUpload={(file) => handleItemUpload(file, setFootwear)}
                            title="4. Upload Footwear"
                            description="e.g., Shoes, sandals, boots."
                            disabled={isItemsDisabled}
                        />
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                    >
                        {isLoadingAnalysis ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                        {isLoadingAnalysis ? 'Analyzing...' : 'Analyze Clothing'}
                    </button>
                </div>

                {/* Right Column: Previews & Output */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                    <div className="grid grid-cols-2 gap-4">
                        {fullDress ? renderPreview(fullDress, 'Full Outfit') : null}
                        {top && !fullDress ? renderPreview(top, 'Top') : null}
                        {bottoms && !fullDress ? renderPreview(bottoms, 'Bottoms') : null}
                        {footwear && !fullDress ? renderPreview(footwear, 'Footwear') : null}
                    </div>
                    <div className="flex-grow flex flex-col mt-4">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">AI Analysis</h3>
                        <div className="bg-gray-900/50 rounded-lg p-4 flex-grow">
                            {isLoadingAnalysis && (
                                <div className="flex items-center justify-center h-full">
                                    <Spinner />
                                    <span className="ml-3 text-gray-400">Analyzing...</span>
                                </div>
                            )}
                            {analysisError && (
                                <div className="text-red-400">{analysisError}</div>
                            )}
                            {!isLoadingAnalysis && !analysis && !analysisError && (
                                <p className="text-gray-500">Analysis results will appear here.</p>
                            )}
                            {analysis && (
                                <div className="space-y-4 text-sm text-gray-300">
                                    {analysis.fullOutfit && <div><h4 className="font-semibold text-cyan-400 mb-1">Full Outfit</h4><p>{analysis.fullOutfit}</p></div>}
                                    {analysis.top && <div><h4 className="font-semibold text-cyan-400 mb-1">Top</h4><p>{analysis.top}</p></div>}
                                    {analysis.bottoms && <div><h4 className="font-semibold text-cyan-400 mb-1">Bottoms</h4><p>{analysis.bottoms}</p></div>}
                                    {analysis.footwear && <div><h4 className="font-semibold text-cyan-400 mb-1">Footwear</h4><p>{analysis.footwear}</p></div>}
                                    {analysis.accessories && <div><h4 className="font-semibold text-cyan-400 mb-1">Accessories</h4><p>{analysis.accessories}</p></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- New Model Generation Section --- */}
            {analysis && !analysisError && (
                <div className="mt-8 pt-8 border-t border-gray-700">
                    <h2 className="text-2xl font-bold text-center text-cyan-400 mb-6">Generate a Model with this Outfit</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         {/* Left Column: Controls */}
                        <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                             <FileUpload 
                                onImageUpload={handleFaceUpload}
                                title="1. Upload Face for Model"
                                description="Upload the face you want to see wearing the analyzed outfit."
                            />
                             {faceForModel && (
                                <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-200">Model Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => setModelGender('female')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${modelGender === 'female' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Female</button>
                                                <button onClick={() => setModelGender('male')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${modelGender === 'male' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Male</button>
                                            </div>
                                        </div>
                                         <div>
                                            <label htmlFor="model-pose" className="block text-sm font-medium text-gray-300 mb-2">
                                                Pose Template
                                            </label>
                                            <select
                                                id="model-pose"
                                                value={selectedPose}
                                                onChange={(e) => setSelectedPose(e.target.value)}
                                                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                            >
                                                {poseTemplates[modelGender].map((pose, index) => (
                                                    <option key={index} value={pose}>{pose}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="face-similarity-clothing" className="block text-sm font-medium text-gray-300 mb-2">
                                            Face Similarity ({faceSimilarity}%)
                                        </label>
                                        <input
                                            id="face-similarity-clothing"
                                            type="range"
                                            min="70"
                                            max="100"
                                            value={faceSimilarity}
                                            onChange={(e) => setFaceSimilarity(Number(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Controls how closely the generated face resembles the uploaded photo.</p>
                                    </div>
                                    <div className="relative flex items-start pt-2">
                                        <div className="flex h-6 items-center">
                                            <input
                                                id="use-enhanced-prompt-clothing"
                                                name="use-enhanced-prompt-clothing"
                                                type="checkbox"
                                                checked={useEnhancedPrompt}
                                                onChange={(e) => setUseEnhancedPrompt(e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm leading-6">
                                            <label htmlFor="use-enhanced-prompt-clothing" className="font-medium text-gray-300">
                                                Use Enhanced Prompt
                                            </label>
                                            <p id="use-enhanced-prompt-description-clothing" className="text-gray-500">
                                                Adds a detailed prompt for better contrast, detail preservation, and photorealism.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-200 mb-2">2. AI-Generated Prompt</h3>
                                <p className="text-gray-400 text-sm mb-2">The AI created this prompt. Edit it below. Add `..` to translate to English, or `.,` to translate to Indonesian.</p>
                                <div className="relative">
                                    <textarea
                                        value={generatedPrompt}
                                        onChange={handlePromptChange}
                                        disabled={isTranslating}
                                        className="w-full p-3 text-sm text-gray-300 bg-gray-900/50 rounded-lg border border-gray-600 h-36 resize-none disabled:cursor-not-allowed disabled:opacity-70"
                                        placeholder="Describe the model's attire and pose..."
                                    />
                                    {isTranslating && (
                                        <div className="absolute inset-0 bg-gray-800/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                                            <Spinner />
                                            <span className="ml-3 text-gray-200">Translating...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleGenerateModelWithClothing}
                                disabled={!faceForModel || isGeneratingModel}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                            >
                                {isGeneratingModel ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                                {isGeneratingModel ? 'Generating Model...' : 'Generate Model with this Outfit'}
                            </button>
                        </div>

                        {/* Right Column: Output */}
                         <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col">
                                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Uploaded Face</h3>
                                {faceForModel ? (
                                    <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                                    <img src={faceForModel.preview} alt="Uploaded face preview" className="rounded-md max-w-full max-h-full object-contain shadow-lg" />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                                    <UserCircleIcon className="w-16 h-16 mb-4" />
                                    <p>Your uploaded face will appear here.</p>
                                    </div>
                                )}
                                </div>
                                <div className="flex flex-col">
                                <ImageDisplay 
                                    imageUrl={currentModelImage} 
                                    isLoading={isGeneratingModel}
                                    onRegenerate={handleGenerateModelWithClothing}
                                    isStandalone={true}
                                    title="Generated Model with Outfit"
                                    error={generationError}
                                />
                                </div>
                            </div>
                             {modelHistory.length > 0 && (
                                <div className="mt-auto pt-4 border-t border-gray-700">
                                    <h4 className="text-lg font-semibold text-cyan-400 mb-3">Generation History</h4>
                                    <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
                                        {modelHistory.map((histImg, index) => (
                                            <div 
                                                key={index}
                                                className="flex-shrink-0 cursor-pointer"
                                                onClick={() => setCurrentModelImage(histImg)}
                                                role="button"
                                                aria-label={`View history item ${index + 1}`}
                                            >
                                                <img 
                                                    src={histImg} 
                                                    alt={`History ${index + 1}`}
                                                    className={`w-24 h-24 object-cover rounded-md border-2 transition-all ${currentModelImage === histImg ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-gray-500'}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClothingIdentifier;