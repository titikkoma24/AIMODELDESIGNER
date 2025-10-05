import React, { useState, useCallback } from 'react';
import { analyzePose, analyzePoseAndClothing, getFriendlyErrorMessage } from '../services/geminiService';
import FileUpload from './FileUpload';
import { PhotoIcon, BrainIcon } from './icons';
import Spinner from './Spinner';

const PoseDetector: React.FC = () => {
    const [poseImage, setPoseImage] = useState<{ file: File; preview: string } | null>(null);
    const [clothingImage, setClothingImage] = useState<{ file: File; preview: string } | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setPoseImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setAnalysis(null);
        setError(null);
    };

    const handleClothingImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setClothingImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setAnalysis(null);
        setError(null);
    };

    const handleAnalyzePose = useCallback(async () => {
        if (!poseImage) {
            setError("Silakan unggah foto pose terlebih dahulu.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const poseBase64 = poseImage.preview.split(',')[1];
            let result = '';
            if (clothingImage) {
                const clothingBase64 = clothingImage.preview.split(',')[1];
                result = await analyzePoseAndClothing(poseBase64, clothingBase64);
            } else {
                result = await analyzePose(poseBase64);
            }
            setAnalysis(result);
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [poseImage, clothingImage]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <FileUpload
                    onImageUpload={handleImageUpload}
                    title="1. Unggah Foto Pose"
                    description="Unggah foto pose untuk mendapatkan deskripsi anatomi terperinci untuk prompt AI."
                />
                <FileUpload
                    onImageUpload={handleClothingImageUpload}
                    title="2. (Opsional) Unggah Referensi Pakaian"
                    description="Unggah foto pakaian untuk digabungkan dengan pose di atas dalam analisis."
                />
                <button
                    onClick={handleAnalyzePose}
                    disabled={!poseImage || isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <BrainIcon className="w-5 h-5" />}
                    {isLoading ? 'Menganalisis...' : clothingImage ? 'Analisis Pose & Pakaian' : 'Analisis Pose'}
                </button>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pose Image Preview */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Foto Pose</h3>
                        {poseImage ? (
                            <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center min-h-[200px]">
                                <img src={poseImage.preview} alt="Uploaded pose preview" className="rounded-md max-w-full max-h-60 object-contain shadow-lg" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8 min-h-[200px]">
                                <PhotoIcon className="w-12 h-12 mb-2" />
                                <p className="text-sm">Unggah foto pose</p>
                            </div>
                        )}
                    </div>

                    {/* Clothing Image Preview */}
                    <div className="flex flex-col">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Referensi Pakaian</h3>
                        {clothingImage ? (
                            <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center min-h-[200px]">
                                <img src={clothingImage.preview} alt="Uploaded clothing preview" className="rounded-md max-w-full max-h-60 object-contain shadow-lg" />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 bg-gray-900/50 rounded-lg p-8 min-h-[200px]">
                                <PhotoIcon className="w-12 h-12 mb-2" />
                                <p className="text-sm">Unggah referensi</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-grow flex flex-col mt-4">
                    <h3 className="text-xl font-semibold text-cyan-400 mb-4">Hasil Analisis AI</h3>
                    <div className="bg-gray-900/50 rounded-lg p-4 flex-grow min-h-[150px]">
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <Spinner />
                                <span className="ml-3 text-gray-400">Menganalisis...</span>
                            </div>
                        )}
                        {error && (
                            <div className="text-red-400">{error}</div>
                        )}
                        {!isLoading && !analysis && !error && (
                            <p className="text-gray-500">Deskripsi detail dari AI akan muncul di sini.</p>
                        )}
                        {analysis && (
                             <textarea
                                readOnly
                                value={analysis}
                                className="w-full h-full p-2 text-sm text-gray-300 bg-transparent rounded-lg border-none resize-none focus:ring-0"
                                aria-label="AI Pose Analysis Result"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default PoseDetector;