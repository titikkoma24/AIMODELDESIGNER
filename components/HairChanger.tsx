import React, { useState, useCallback, useEffect } from 'react';
import { changeHairStyle, analyzeHairStyle } from '../services/geminiService';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon, BrainIcon } from './icons';
import Spinner from './Spinner';
import { hairTemplatesID } from '../constants/hairTemplatesID';

const HairChanger: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [gender, setGender] = useState<'wanita' | 'pria'>('wanita');
    
    const [hairOption, setHairOption] = useState<'template' | 'manual' | 'reference-photo'>('template');
    const [manualHair, setManualHair] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>(hairTemplatesID.wanita[0]);
    
    const [hairImageFile, setHairImageFile] = useState<File | null>(null);
    const [hairImagePreview, setHairImagePreview] = useState<string | null>(null);
    const [isAnalyzingHair, setIsAnalyzingHair] = useState<boolean>(false);

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedTemplate(hairTemplatesID[gender][0]);
    }, [gender]);

    const handleImageUpload = (file: File) => {
        setImageFile(file);
        setCurrentImage(null);
        setHistory([]);
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
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

    const handleAnalyzeHair = useCallback(async () => {
        if (!hairImagePreview) {
            setError('Silakan unggah foto referensi rambut terlebih dahulu.');
            return;
        }
        setIsAnalyzingHair(true);
        setError(null);
        try {
            const base64Data = hairImagePreview.split(',')[1];
            const analysisResult = await analyzeHairStyle(base64Data);
            setManualHair(analysisResult);
            setHairOption('manual'); 
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal menganalisis gaya rambut.');
        } finally {
            setIsAnalyzingHair(false);
        }
    }, [hairImagePreview]);


    const handleGenerate = useCallback(async () => {
        if (!imagePreview) {
            setError('Silakan unggah foto model terlebih dahulu.');
            return;
        }

        let hairStylePrompt = '';
        let hairReferenceBase64: string | null = null;

        switch (hairOption) {
            case 'template':
                hairStylePrompt = selectedTemplate;
                break;
            case 'manual':
                if (!manualHair.trim()) {
                    setError('Silakan masukkan deskripsi rambut manual.');
                    return;
                }
                hairStylePrompt = manualHair;
                break;
            case 'reference-photo':
                if (!hairImagePreview) {
                    setError('Silakan unggah foto referensi rambut.');
                    return;
                }
                hairStylePrompt = '**CRITICAL HAIR INSTRUCTION:** The new hairstyle (including color, length, and style) MUST be a 100% EXACT REPLICA of the hairstyle shown in the separate hair reference image. You MUST completely IGNORE the hair from the primary face photo and use the reference image for the hair.';
                hairReferenceBase64 = hairImagePreview.split(',')[1];
                break;
        }

        setIsLoading(true);
        setError(null);
        setCurrentImage(null);

        try {
            const base64FaceData = imagePreview.split(',')[1];
            const result = await changeHairStyle(base64FaceData, hairStylePrompt, gender, hairReferenceBase64);
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat model.');
        } finally {
            setIsLoading(false);
        }
    }, [imagePreview, selectedTemplate, gender, hairOption, manualHair, hairImagePreview]);

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                    <FileUpload
                        onImageUpload={handleImageUpload}
                        title="1. Unggah Foto Model"
                        description="Unggah foto untuk mengganti gaya rambut. Wajah, pakaian, dan pose akan dipertahankan."
                    />

                    {imageFile && (
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">2. Konfigurasi Model</h3>
                            <div>
                                <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-2">
                                    Gender
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setGender('wanita')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${gender === 'wanita' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Wanita</button>
                                    <button onClick={() => setGender('pria')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${gender === 'pria' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Pria</button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Sumber Gaya Rambut</label>
                                <fieldset className="space-y-2">
                                    <legend className="sr-only">Hair Source</legend>
                                    <div className="flex items-center">
                                        <input id="hair-template-radio" name="hair-option" type="radio" checked={hairOption === 'template'} onChange={() => setHairOption('template')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                        <label htmlFor="hair-template-radio" className="ml-3 block text-sm font-medium text-gray-300">Pilih dari Template</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="hair-reference-radio" name="hair-option" type="radio" checked={hairOption === 'reference-photo'} onChange={() => setHairOption('reference-photo')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                        <label htmlFor="hair-reference-radio" className="ml-3 block text-sm font-medium text-gray-300">Gunakan Foto Referensi</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input id="hair-manual-radio" name="hair-option" type="radio" checked={hairOption === 'manual'} onChange={() => setHairOption('manual')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                        <label htmlFor="hair-manual-radio" className="ml-3 block text-sm font-medium text-gray-300">Tulis Manual</label>
                                    </div>
                                </fieldset>
                            </div>

                            {hairOption === 'template' && (
                                <div>
                                    <label htmlFor="template-hair" className="block text-sm font-medium text-gray-300 mb-2">Pilih Gaya Rambut</label>
                                    <select
                                        id="template-hair"
                                        value={selectedTemplate}
                                        onChange={(e) => setSelectedTemplate(e.target.value)}
                                        className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                    >
                                        {hairTemplatesID[gender].map(template => (
                                        <option key={template} value={template}>{template}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {hairOption === 'reference-photo' && (
                                <div className="space-y-4">
                                    <FileUpload
                                        onImageUpload={handleHairImageUpload}
                                        title=""
                                        description="Unggah gambar gaya rambut yang diinginkan."
                                    />
                                    {hairImagePreview && (
                                        <div className="space-y-3">
                                            <div className="p-2 bg-gray-800 rounded-lg">
                                                <p className="text-xs text-center text-gray-400 mb-2">Pratinjau Referensi Rambut</p>
                                                <img src={hairImagePreview} alt="Pratinjau referensi rambut" className="rounded-md max-h-32 mx-auto" />
                                            </div>
                                            <button
                                                onClick={handleAnalyzeHair}
                                                disabled={isAnalyzingHair}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                                            >
                                                {isAnalyzingHair ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                                                {isAnalyzingHair ? 'Menganalisis...' : 'Analisis Gaya Rambut AI'}
                                            </button>
                                            <p className="text-xs text-gray-400 text-center">AI akan menganalisis foto dan membuat deskripsi teks untuk Anda gunakan.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {hairOption === 'manual' && (
                                <div>
                                    <label htmlFor="manual-hair" className="block text-sm font-medium text-gray-300 mb-2">Deskripsi Rambut Manual</label>
                                    <textarea
                                        id="manual-hair"
                                        rows={3}
                                        value={manualHair}
                                        onChange={(e) => setManualHair(e.target.value)}
                                        className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                        placeholder={gender === 'wanita' ? 'contoh: rambut bob pendek warna pink cerah dengan poni' : 'contoh: rambut mohawk dengan sisi tipis'}
                                    />
                                </div>
                            )}

                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={!imageFile || isLoading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                    >
                        {isLoading ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                        {isLoading ? 'Memproses...' : 'Ganti Gaya Rambut'}
                    </button>
                </div>

                {/* Right Column: Output */}
                <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                        <div className="flex flex-col">
                            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Foto Asli</h3>
                            {imagePreview ? (
                                <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                                    <img src={imagePreview} alt="Uploaded face preview" className="rounded-md max-w-full max-h-full object-contain shadow-lg" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8">
                                    <PhotoIcon className="w-16 h-16 mb-4" />
                                    <p>Foto yang Anda unggah akan muncul di sini.</p>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <ImageDisplay
                                imageUrl={currentImage}
                                isLoading={isLoading}
                                onRegenerate={handleGenerate}
                                isStandalone={true}
                                title="Hasil Gaya Rambut Baru"
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

export default HairChanger;