import React, { useState, useCallback } from 'react';
import { analyzeImageForPrompt, refinePromptWithModifications, PromptModifications, analyzeHairStyle } from '../services/geminiService';
import FileUpload from './FileUpload';
import { PhotoIcon, BrainIcon, ClipboardIcon, CheckIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';

const ModificationInput: React.FC<{label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string}> = ({ label, value, onChange, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
        />
    </div>
);

const HackedPrompt: React.FC = () => {
    const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [isUpdatedCopied, setIsUpdatedCopied] = useState<boolean>(false);

    // State for modifications
    const [gender, setGender] = useState<'pria' | 'wanita'>('pria');
    const [objectCount, setObjectCount] = useState('');
    const [shirt, setShirt] = useState('');
    const [pants, setPants] = useState('');
    const [shoes, setShoes] = useState('');
    const [accessories, setAccessories] = useState('');
    const [lockFace, setLockFace] = useState(false);
    const [updatedPrompt, setUpdatedPrompt] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // State for hair modifications
    const [isHijab, setIsHijab] = useState(false);
    const [hairDescription, setHairDescription] = useState('');
    const [hairReference, setHairReference] = useState<{ file: File; preview: string } | null>(null);
    const [isAnalyzingHair, setIsAnalyzingHair] = useState(false);


    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setGeneratedPrompt(null);
        setUpdatedPrompt(null);
        setError(null);
    };

    const handleHairReferenceUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setHairReference({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = useCallback(async () => {
        if (!image) {
            setError("Please upload an image first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedPrompt(null);
        setUpdatedPrompt(null);

        try {
            const imageBase64 = image.preview.split(',')[1];
            const result = await analyzeImageForPrompt(imageBase64);
            setGeneratedPrompt(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
        } finally {
            setIsLoading(false);
        }
    }, [image]);

    const handleAnalyzeHair = useCallback(async () => {
        if (!hairReference) return;
        
        setIsAnalyzingHair(true);
        setError(null);
        try {
            const imageBase64 = hairReference.preview.split(',')[1];
            const result = await analyzeHairStyle(imageBase64);
            setHairDescription(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Gagal menganalisis rambut.");
        } finally {
            setIsAnalyzingHair(false);
        }
    }, [hairReference]);

    const handleCopyToClipboard = (text: string | null, type: 'original' | 'updated') => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            if (type === 'original') {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } else {
                setIsUpdatedCopied(true);
                setTimeout(() => setIsUpdatedCopied(false), 2000);
            }
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };
    
    const handleUpdatePrompt = useCallback(async () => {
        if (!generatedPrompt) return;

        setIsUpdating(true);
        setError(null);
        try {
            const modifications: PromptModifications = {
                gender,
                objectCount: objectCount.trim() || undefined,
                shirt: shirt.trim() || undefined,
                pants: pants.trim() || undefined,
                shoes: shoes.trim() || undefined,
                accessories: accessories.trim() || undefined,
                lockFace,
                isHijab,
                hairDescription: !isHijab && hairDescription.trim() ? hairDescription.trim() : undefined,
            };

            const result = await refinePromptWithModifications(generatedPrompt, modifications);
            setUpdatedPrompt(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred while updating the prompt.");
        } finally {
            setIsUpdating(false);
        }

    }, [generatedPrompt, gender, objectCount, shirt, pants, shoes, accessories, lockFace, isHijab, hairDescription]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <FileUpload
                    onImageUpload={handleImageUpload}
                    title="1. Upload Image"
                    description="Upload any AI-generated or real image to analyze and extract a reusable prompt."
                />
                <div className="flex flex-col">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">Uploaded Image</h3>
                    {image ? (
                        <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center min-h-[200px]">
                            <img src={image.preview} alt="Uploaded preview" className="rounded-md max-w-full max-h-60 object-contain shadow-lg" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8 min-h-[200px]">
                            <PhotoIcon className="w-12 h-12 mb-2" />
                            <p className="text-sm">Your image will appear here</p>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleAnalyze}
                    disabled={!image || isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                    {isLoading ? 'Analyzing...' : 'Analyze Image to Prompt'}
                </button>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                <div className="flex-grow flex flex-col">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4">AI Analysis Result</h3>
                    <div className="bg-gray-900/50 rounded-lg p-4 flex-grow min-h-[150px] relative">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <Spinner />
                                <span className="ml-3 text-gray-400">Generating prompt...</span>
                            </div>
                        )}
                        {error && (
                            <div className="text-red-400 text-center">{error}</div>
                        )}
                        {!isLoading && !generatedPrompt && !error && (
                            <p className="text-gray-500 text-center">The generated prompt will appear here.</p>
                        )}
                        {generatedPrompt && (
                             <>
                                <textarea
                                    readOnly
                                    value={generatedPrompt}
                                    className="w-full h-full p-2 text-sm text-gray-300 bg-transparent rounded-lg border-none resize-none focus:ring-0"
                                    aria-label="Generated Prompt"
                                />
                                <button
                                    onClick={() => handleCopyToClipboard(generatedPrompt, 'original')}
                                    className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
                                >
                                    {isCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                                    {isCopied ? 'Copied!' : 'Copy Prompt'}
                                </button>
                             </>
                        )}
                    </div>
                </div>

                {generatedPrompt && (
                    <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                        <h3 className="text-xl font-semibold text-cyan-400">Ubah Kebutuhan</h3>
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Kelamin</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setGender('pria')} className={`py-2 text-sm rounded-md ${gender === 'pria' ? 'bg-cyan-600 text-white' : 'bg-gray-700'}`}>Pria</button>
                                    <button onClick={() => setGender('wanita')} className={`py-2 text-sm rounded-md ${gender === 'wanita' ? 'bg-cyan-600 text-white' : 'bg-gray-700'}`}>Wanita</button>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-gray-700/50">
                                <div className="relative flex items-start">
                                    <div className="flex h-6 items-center">
                                        <input id="is-hijab" type="checkbox" checked={isHijab} onChange={(e) => setIsHijab(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500" />
                                    </div>
                                    <div className="ml-3 text-sm leading-6">
                                        <label htmlFor="is-hijab" className="font-medium text-gray-300">Subjek menggunakan Hijab</label>
                                    </div>
                                </div>
                            </div>

                            {!isHijab && (
                                <div className="space-y-4 pt-2 border-t border-gray-700/50">
                                    <h4 className="text-md font-semibold text-gray-300">Detail Rambut</h4>
                                    <div>
                                        <label htmlFor="hair-desc" className="block text-sm font-medium text-gray-400 mb-1">Deskripsi Rambut (Manual)</label>
                                        <textarea id="hair-desc" value={hairDescription} onChange={(e) => setHairDescription(e.target.value)} rows={3} placeholder="cth: rambut panjang bergelombang warna pirang" className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500" />
                                    </div>
                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-600" /></div>
                                        <div className="relative flex justify-center"><span className="bg-gray-900/50 px-3 text-sm font-medium text-gray-400 rounded-full">ATAU</span></div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Gunakan Referensi Foto Rambut</label>
                                        <FileUpload onImageUpload={handleHairReferenceUpload} title="" description="" />
                                        {hairReference && (
                                            <div className="mt-2 space-y-2">
                                                <img src={hairReference.preview} alt="Hair reference" className="rounded-md max-h-32 mx-auto" />
                                                <button onClick={handleAnalyzeHair} disabled={isAnalyzingHair} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                                    {isAnalyzingHair ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                                                    {isAnalyzingHair ? 'Menganalisis...' : 'Analisis Rambut dari Foto'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-700/50">
                                <ModificationInput label="Jumlah Objek" value={objectCount} onChange={(e) => setObjectCount(e.target.value)} placeholder="cth: 2 orang, seekor anjing" />
                                <ModificationInput label="Baju" value={shirt} onChange={(e) => setShirt(e.target.value)} placeholder="cth: kemeja flanel merah" />
                                <ModificationInput label="Celana" value={pants} onChange={(e) => setPants(e.target.value)} placeholder="cth: celana jeans biru" />
                                <ModificationInput label="Sepatu" value={shoes} onChange={(e) => setShoes(e.target.value)} placeholder="cth: sepatu boots coklat" />
                            </div>
                            <ModificationInput label="Aksesoris" value={accessories} onChange={(e) => setAccessories(e.target.value)} placeholder="cth: topi, kacamata hitam" />
                            
                            <div className="relative flex items-start pt-2">
                                <div className="flex h-6 items-center">
                                    <input
                                        id="lock-face"
                                        name="lock-face"
                                        type="checkbox"
                                        checked={lockFace}
                                        onChange={(e) => setLockFace(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor="lock-face" className="font-medium text-gray-300">
                                        Lock Wajah
                                    </label>
                                    <p className="text-gray-500 text-xs">
                                        *Jangan rubah detail wajah sedikitpun, Pertahankan kemiripan wajah dan ekspresi 100%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleUpdatePrompt}
                            disabled={isUpdating}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-md hover:bg-cyan-500 disabled:bg-gray-600"
                        >
                            {isUpdating ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                            {isUpdating ? 'Updating...' : 'Update Prompt'}
                        </button>
                    </div>
                )}
                
                {updatedPrompt && (
                    <div className="flex-grow flex flex-col">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-2">Updated Prompt</h3>
                        <div className="bg-gray-900/50 rounded-lg p-4 flex-grow min-h-[150px] relative">
                             <textarea
                                readOnly
                                value={updatedPrompt}
                                className="w-full h-full p-2 text-sm text-gray-300 bg-transparent rounded-lg border-none resize-none focus:ring-0"
                                aria-label="Updated Prompt"
                            />
                            <button
                                onClick={() => handleCopyToClipboard(updatedPrompt, 'updated')}
                                className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200"
                            >
                                {isUpdatedCopied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                                {isUpdatedCopied ? 'Copied!' : 'Copy Prompt'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default HackedPrompt;