import React, { useState, useCallback, useRef, useEffect } from 'react';
import { editWithNanoBanana, generateImageFromText, improvePrompt, translateText } from '../services/geminiService';
import { shotStyles, lightStyles, aspectRatios, imageStylesForGenerator } from '../constants/backgroundTemplates';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon, XMarkIcon, SparklesIcon, PencilIcon, CheckIcon, ArrowUturnLeftIcon } from './icons';
import Spinner from './Spinner';

const NanoBananaEditor: React.FC = () => {
    const [mode, setMode] = useState<'edit' | 'generate'>('edit');
    const [sourceImages, setSourceImages] = useState<{ file: File; preview: string }[]>([]);
    const [prompt, setPrompt] = useState<string>('Make the person wear a futuristic cyberpunk jacket');
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(aspectRatios[0]);
    const [selectedShotStyle, setSelectedShotStyle] = useState<string>('Original');
    const [selectedImageStyle, setSelectedImageStyle] = useState<string>('Original');
    const [imageStyleDescription, setImageStyleDescription] = useState<string>('');
    const [selectedLightStyle, setSelectedLightStyle] = useState<string>('Original');
    const [preserveFaceDetails, setPreserveFaceDetails] = useState<boolean>(true);
    
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isImprovingPrompt, setIsImprovingPrompt] = useState<boolean>(false);
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [lightStyleDescription, setLightStyleDescription] = useState<string>('');

    // --- Lasso Tool State ---
    const [isLassoActive, setIsLassoActive] = useState<boolean>(false);
    const [maskBase64, setMaskBase64] = useState<string | null>(null);
    const [showMaskPromptModal, setShowMaskPromptModal] = useState<boolean>(false);
    const [maskedPrompt, setMaskedPrompt] = useState<string>('');
    const [maskedReferenceImage, setMaskedReferenceImage] = useState<{ file: File; preview: string } | null>(null);


    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState<{ x: number; y: number }[]>([]);

     useEffect(() => {
        if (selectedLightStyle === 'Original') {
            setLightStyleDescription('');
        } else {
            const selectedStyle = lightStyles.find(style => style.name === selectedLightStyle);
            setLightStyleDescription(selectedStyle ? selectedStyle.description : '');
        }
    }, [selectedLightStyle]);

    useEffect(() => {
        if (selectedImageStyle === 'Original') {
            setImageStyleDescription('');
        } else {
            const selected = imageStylesForGenerator.find(style => style.name === selectedImageStyle);
            setImageStyleDescription(selected ? selected.description : '');
        }
    }, [selectedImageStyle]);


    const handleModeChange = (newMode: 'edit' | 'generate') => {
        setMode(newMode);
        setError(null);
        setCurrentImage(null);
        setHistory([]);
        setSourceImages([]);
        setIsLassoActive(false);
        setMaskBase64(null);
        setSelectedImageStyle('Original');
        if (newMode === 'generate') {
            setPrompt('A photorealistic image of a majestic lion in the savanna at sunset');
            setPreserveFaceDetails(false);
        } else {
            setPrompt('Make the person wear a futuristic cyberpunk jacket');
            setPreserveFaceDetails(true);
        }
    };

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
        if (indexToRemove === 0) {
            setIsLassoActive(false);
        }
    };

    const handlePromptChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newPrompt = e.target.value;
        setPrompt(newPrompt);

        let translationConfig: { trigger: string; lang: string; } | null = null;
        if (newPrompt.endsWith('..')) {
            translationConfig = { trigger: '..', lang: 'English' };
        } else if (newPrompt.endsWith('.,')) {
            translationConfig = { trigger: '.,', lang: 'Indonesian' };
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

    const handleGenerate = useCallback(async (isMaskedEdit: boolean = false) => {
        const currentPrompt = isMaskedEdit ? maskedPrompt : prompt;
        const hasMaskedReference = isMaskedEdit && !!maskedReferenceImage;

        if (mode === 'edit' && sourceImages.length === 0) {
            setError('Please upload at least one image to edit.');
            return;
        }
        if (isMaskedEdit && !currentPrompt.trim() && !hasMaskedReference) {
            setError('For a masked edit, please provide a text description or a reference image.');
            setShowMaskPromptModal(true);
            return;
        }
         if (mode === 'generate' && !currentPrompt.trim()) {
            setError('Please enter a prompt to describe your request.');
            return;
        }
         if (isMaskedEdit && !maskBase64) {
            setError('Mask data is missing for the masked edit.');
            return;
        }


        setIsLoading(true);
        setError(null);
        setCurrentImage(null);

        try {
            let result: string;
            if (mode === 'edit') {
                const base64Images = sourceImages.map(img => img.preview.split(',')[1]);
                let finalImagesForApi = [...base64Images];

                if (hasMaskedReference && maskedReferenceImage) {
                    const maskedRefBase64 = maskedReferenceImage.preview.split(',')[1];
                    // Insert the reference image right after the primary image.
                    finalImagesForApi.splice(1, 0, maskedRefBase64);
                }

                result = await editWithNanoBanana(
                    finalImagesForApi,
                    currentPrompt,
                    selectedShotStyle,
                    selectedLightStyle,
                    selectedAspectRatio,
                    preserveFaceDetails,
                    isMaskedEdit ? maskBase64 : null,
                    hasMaskedReference
                );
            } else { // mode === 'generate'
                const styleInfo = imageStylesForGenerator.find(s => s.name === selectedImageStyle);
                const imageStyleValue = styleInfo ? styleInfo.promptValue : '';

                result = await generateImageFromText(
                    prompt,
                    selectedAspectRatio,
                    selectedShotStyle,
                    selectedLightStyle,
                    imageStyleValue
                );
            }
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
        } finally {
            setIsLoading(false);
            setMaskBase64(null);
            setMaskedPrompt('');
            setMaskedReferenceImage(null);
        }
    }, [mode, sourceImages, prompt, maskedPrompt, maskBase64, selectedShotStyle, selectedLightStyle, selectedAspectRatio, preserveFaceDetails, maskedReferenceImage, selectedImageStyle]);


    // --- Lasso Drawing Logic ---

    const getCoords = (event: React.MouseEvent | React.TouchEvent): { x: number, y: number } | null => {
        if (!canvasRef.current) return null;
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let x, y;

        const nativeEvent = event.nativeEvent;
        if (nativeEvent instanceof MouseEvent) {
            x = nativeEvent.clientX - rect.left;
            y = nativeEvent.clientY - rect.top;
        } else if (nativeEvent instanceof TouchEvent) {
            if (nativeEvent.touches.length === 0) return null;
            x = nativeEvent.touches[0].clientX - rect.left;
            y = nativeEvent.touches[0].clientY - rect.top;
        } else {
            return null;
        }
        return { x, y };
    };

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDrawing(true);
        const coords = getCoords(e);
        if (coords) setPoints([coords]);
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (isDrawing) {
            const coords = getCoords(e);
            if (coords) {
                setPoints(prevPoints => [...prevPoints, coords]);
            }
        }
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    useEffect(() => {
        if (!isLassoActive || !canvasRef.current || !imageRef.current) return;
        
        const canvas = canvasRef.current;
        const image = imageRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = image.clientWidth;
        canvas.height = image.clientHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (points.length < 2) return;

        ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();

        if (!isDrawing && points.length > 2) {
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
            ctx.fill();
        }
    }, [points, isDrawing, isLassoActive]);

    const handleFinalizeSelection = () => {
        if (points.length < 3 || !imageRef.current) return;

        const image = imageRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.naturalWidth;
        tempCanvas.height = image.naturalHeight;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        const scaleX = image.naturalWidth / image.clientWidth;
        const scaleY = image.naturalHeight / image.clientHeight;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(points[0].x * scaleX, points[0].y * scaleY);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x * scaleX, points[i].y * scaleY);
        }
        ctx.closePath();
        ctx.fill();
        
        const maskDataUrl = tempCanvas.toDataURL('image/png');
        setMaskBase64(maskDataUrl.split(',')[1]);
        setIsLassoActive(false);
        setShowMaskPromptModal(true);
    };

    const clearLasso = () => {
        setPoints([]);
        setIsDrawing(false);
    };

    const handleLassoButtonClick = () => {
        setIsLassoActive(!isLassoActive);
        setMaskBase64(null);
        clearLasso();
    };

     const handleMaskPromptSubmit = () => {
        if (!maskedPrompt.trim() && !maskedReferenceImage) {
            return; // Prevent submitting an empty request
        }
        setShowMaskPromptModal(false);
        handleGenerate(true);
    };

    const handleMaskedReferenceUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setMaskedReferenceImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
    };


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3">Mode</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleModeChange('edit')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${mode === 'edit' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Edit Photo</button>
                            <button onClick={() => handleModeChange('generate')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${mode === 'generate' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Generate from Text</button>
                        </div>
                    </div>

                    {mode === 'edit' && (
                        <>
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
                        </>
                    )}

                    <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-200">{mode === 'edit' ? '2. Describe Your Edits' : '1. Describe Image to Generate'}</h3>
                             {mode === 'edit' && (
                                <button
                                    onClick={handleLassoButtonClick}
                                    disabled={sourceImages.length === 0}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isLassoActive ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                                >
                                    <PencilIcon className="w-4 h-4" />
                                    Lasso Select
                                </button>
                            )}
                        </div>
                         <p className="text-sm text-gray-400">
                           Add `..` to translate to English, or `.,` to translate to Indonesian.
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
                                    placeholder={mode === 'edit' ? 'e.g., Change the background to a Paris street' : 'e.g., A golden retriever puppy playing in a field of flowers'}
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
                    
                    <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200">{mode === 'edit' ? '3. Output Settings' : '2. Output Settings'}</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="nano-aspect-ratio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                                <select id="nano-aspect-ratio" value={selectedAspectRatio} onChange={(e) => setSelectedAspectRatio(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                    {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="nano-shot-style" className="block text-sm font-medium text-gray-300 mb-2">Shot Style</label>
                                <select id="nano-shot-style" value={selectedShotStyle} onChange={(e) => setSelectedShotStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                    <option value="Original">Original</option>
                                    {shotStyles.map(style => <option key={style} value={style}>{style}</option>)}
                                </select>
                            </div>
                         </div>
                         {mode === 'generate' && (
                             <div>
                                <label htmlFor="nano-image-style" className="block text-sm font-medium text-gray-300 mb-2">Style Gambar</label>
                                <select id="nano-image-style" value={selectedImageStyle} onChange={(e) => setSelectedImageStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                    {imageStylesForGenerator.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                                </select>
                                {imageStyleDescription && <p className="text-xs text-gray-400 mt-2">{imageStyleDescription}</p>}
                            </div>
                         )}
                         <div>
                            <label htmlFor="nano-light-style" className="block text-sm font-medium text-gray-300 mb-2">Light Style</label>
                            <select id="nano-light-style" value={selectedLightStyle} onChange={(e) => setSelectedLightStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                <option value="Original">Original</option>
                                {lightStyles.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                            </select>
                            {lightStyleDescription && <p className="text-xs text-gray-400 mt-2">{lightStyleDescription}</p>}
                         </div>
                         {mode === 'edit' && (
                             <div className="relative flex items-start pt-4">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="preserve-face-details"
                                        name="preserve-face-details"
                                        type="checkbox"
                                        checked={preserveFaceDetails}
                                        onChange={(e) => setPreserveFaceDetails(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="preserve-face-details" className="font-medium text-gray-300">
                                        Pertahankan Detail Wajah
                                    </label>
                                    <p id="preserve-face-details-description" className="text-gray-500">
                                        Jika dicentang, AI akan menjaga detail wajah sesuai foto asli. Hapus centang untuk transformasi yang lebih bebas (misal: ubah usia, ekspresi).
                                    </p>
                                </div>
                            </div>
                         )}
                    </div>

                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={(mode === 'edit' && sourceImages.length === 0) || isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                    >
                        {isLoading ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                        {isLoading ? 'Generating...' : (mode === 'edit' ? 'Generate with Nano Banana' : 'Generate Image')}
                    </button>
                </div>

                {/* Right Column: Output */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-semibold text-cyan-400 mb-4">{mode === 'edit' ? 'Original Photos' : 'Source'}</h3>
                            {mode === 'edit' ? (
                                sourceImages.length > 0 ? (
                                    <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex flex-col items-center justify-center gap-2">
                                        <div className="relative w-full">
                                            <img
                                                ref={imageRef}
                                                src={sourceImages[0].preview}
                                                alt="Original content 1"
                                                className={`rounded-md w-full object-contain shadow-lg ${isLassoActive ? 'cursor-crosshair' : ''}`}
                                            />
                                            {isLassoActive && (
                                                <canvas
                                                    ref={canvasRef}
                                                    className="absolute top-0 left-0 w-full h-full"
                                                    onMouseDown={handleMouseDown}
                                                    onMouseMove={handleMouseMove}
                                                    onMouseUp={handleMouseUp}
                                                    onMouseLeave={handleMouseUp}
                                                    onTouchStart={handleMouseDown}
                                                    onTouchMove={handleMouseMove}
                                                    onTouchEnd={handleMouseUp}
                                                    aria-label="Lasso drawing area"
                                                />
                                            )}
                                        </div>
                                        {isLassoActive && (
                                            <div className="w-full flex justify-center gap-2 mt-2">
                                                <button onClick={handleFinalizeSelection} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-500 transition-colors shadow-lg"><CheckIcon className="w-4 h-4" /> Done</button>
                                                <button onClick={clearLasso} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-md text-xs font-semibold hover:bg-gray-500 transition-colors shadow-lg"><ArrowUturnLeftIcon className="w-4 h-4"/> Clear</button>
                                            </div>
                                        )}
                                         {sourceImages.length > 1 && (
                                            <div className="grid grid-cols-3 gap-2 mt-2">
                                                {sourceImages.slice(1).map((image, index) => (
                                                    <img key={index} src={image.preview} alt={`Original content ${index + 2}`} className="rounded-md w-full object-contain shadow-lg" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                                        <PhotoIcon className="w-16 h-16 mb-4" />
                                        <p>Your uploaded photo(s) will appear here.</p>
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                                    <SparklesIcon className="w-16 h-16 mb-4" />
                                    <p>Generating from text prompt only.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <ImageDisplay
                                imageUrl={currentImage}
                                isLoading={isLoading}
                                onRegenerate={() => handleGenerate(!!maskBase64)}
                                isStandalone={true}
                                title={mode === 'edit' ? 'Edited Image' : 'Generated Image'}
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
            {showMaskPromptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" aria-modal="true" role="dialog">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4 border border-gray-700 shadow-2xl">
                        <h3 className="text-lg font-semibold text-cyan-400">Edit Selected Area</h3>
                        <p className="text-sm text-gray-400">Describe the changes you want to apply to the selected area.</p>
                        <textarea
                            value={maskedPrompt}
                            onChange={(e) => setMaskedPrompt(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                            placeholder="e.g., add a pirate hat (optional)"
                            aria-label="Prompt for selected area"
                        />

                        <div className="relative my-1">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-600" /></div>
                            <div className="relative flex justify-center"><span className="bg-gray-800 px-2 text-sm text-gray-400">OR</span></div>
                        </div>
                        
                        <FileUpload
                            onImageUpload={handleMaskedReferenceUpload}
                            title=""
                            description="Upload an image to place inside the selection."
                        />

                        {maskedReferenceImage && (
                            <div className="relative w-24 h-24 mx-auto">
                                <img src={maskedReferenceImage.preview} alt="Mask reference" className="rounded-md w-full h-full object-cover" />
                                <button
                                    onClick={() => setMaskedReferenceImage(null)}
                                    className="absolute -top-1 -right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-0.5 z-10"
                                    aria-label="Remove reference image"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => {setShowMaskPromptModal(false); setMaskBase64(null); setMaskedReferenceImage(null);}} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-600 rounded-md hover:bg-gray-500 transition-colors">Cancel</button>
                            <button onClick={handleMaskPromptSubmit} disabled={!maskedPrompt.trim() && !maskedReferenceImage} className="px-4 py-2 text-sm font-medium text-gray-900 bg-cyan-400 rounded-md hover:bg-cyan-500 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">Apply</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NanoBananaEditor;
