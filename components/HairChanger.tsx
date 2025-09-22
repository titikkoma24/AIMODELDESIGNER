import React, { useState, useCallback, useEffect } from 'react';
import { changeHairStyle } from '../services/geminiService';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon } from './icons';
import Spinner from './Spinner';
import { hairTemplatesID } from '../constants/hairTemplatesID';

const HairChanger: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [gender, setGender] = useState<'wanita' | 'pria'>('wanita');
    
    // New state for hair input options
    const [hairOption, setHairOption] = useState<'template' | 'manual'>('template');
    const [manualHair, setManualHair] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>(hairTemplatesID.wanita[0]);
    
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSelectedTemplate(hairTemplatesID[gender][0]);
    }, [gender]);

    const handleImageUpload = (file: File) => {
        setImageFile(file);
        setGeneratedImage(null);
        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = useCallback(async () => {
        if (!imagePreview) {
            setError('Silakan unggah foto model terlebih dahulu.');
            return;
        }

        let hairStylePrompt = '';
        if (hairOption === 'template') {
            hairStylePrompt = selectedTemplate;
        } else { // manual
            if (!manualHair.trim()) {
                setError('Silakan masukkan deskripsi rambut manual.');
                return;
            }
            hairStylePrompt = manualHair;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const base64FaceData = imagePreview.split(',')[1];
            const result = await changeHairStyle(base64FaceData, hairStylePrompt, gender);
            setGeneratedImage(`data:image/jpeg;base64,${result}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat model.');
        } finally {
            setIsLoading(false);
        }
    }, [imagePreview, selectedTemplate, gender, hairOption, manualHair]);

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
                                imageUrl={generatedImage}
                                isLoading={isLoading}
                                onRegenerate={handleGenerate}
                                isStandalone={true}
                                title="Hasil Gaya Rambut Baru"
                                error={error}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HairChanger;