import React, { useState, useCallback, useEffect } from 'react';
import { touchUpFace } from '../services/geminiService';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon, FaceSmileIcon } from './icons';
import Spinner from './Spinner';
import { touchUpTemplates, eyebrowTemplates, eyelinerTemplates } from '../constants/touchUpTemplates';

const FaceTouchUp: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [gender, setGender] = useState<'wanita' | 'pria'>('wanita');
    
    const [touchUpOption, setTouchUpOption] = useState<'template' | 'manual' | 'subtle'>('template');
    const [manualPrompt, setManualPrompt] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>(touchUpTemplates.wanita[0].value);
    
    interface SubtleOptions {
      removeBlemishes: boolean;
      useLipstick: boolean;
      lipstickColor: string;
      useBlushOn: boolean;
      blushOnColor: string;
      useEyeshadow: boolean;
      eyeshadowColor: string;
      useEyebrows: boolean;
      eyebrowStyle: string;
      useEyeliner: boolean;
      eyelinerStyle: string;
    }

    const [subtleOptions, setSubtleOptions] = useState<SubtleOptions>({
      removeBlemishes: true,
      useLipstick: false,
      lipstickColor: '#d17a82',
      useBlushOn: false,
      blushOnColor: '#e08c98',
      useEyeshadow: false,
      eyeshadowColor: '#c49a9a',
      useEyebrows: false,
      eyebrowStyle: eyebrowTemplates[0],
      useEyeliner: false,
      eyelinerStyle: eyelinerTemplates[0],
    });

    const handleSubtleOptionChange = <K extends keyof SubtleOptions>(key: K, value: SubtleOptions[K]) => {
        setSubtleOptions(prev => ({ ...prev, [key]: value }));
    };

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const newTemplates = touchUpTemplates[gender];
        setSelectedTemplate(newTemplates[0].value);
        if (gender === 'pria') {
            setTouchUpOption('template');
        }
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

    const handleGenerate = useCallback(async () => {
        if (!imagePreview) {
            setError('Silakan unggah foto terlebih dahulu.');
            return;
        }

        let finalPrompt = '';
        if (touchUpOption === 'template') {
            finalPrompt = selectedTemplate;
        } else if (touchUpOption === 'manual') {
            if (!manualPrompt.trim()) {
                setError('Silakan masukkan deskripsi touch up manual.');
                return;
            }
            finalPrompt = manualPrompt;
        } else if (touchUpOption === 'subtle') {
            let parts: string[] = [];
            parts.push("Apply subtle, 'tipis-tipis' makeup with the following instructions:");

            if (subtleOptions.removeBlemishes) {
                parts.push("- Even out the skin tone, remove minor blemishes, and gently brighten the face.");
            }
            if (subtleOptions.useLipstick) {
                parts.push(`- Apply a lipstick with the plain color hex code ${subtleOptions.lipstickColor}.`);
            }
            if (subtleOptions.useBlushOn) {
                parts.push(`- Apply a soft blush on the cheeks with the plain color hex code ${subtleOptions.blushOnColor}.`);
            }
            if (subtleOptions.useEyeshadow) {
                parts.push(`- Apply a gentle eyeshadow with the plain color hex code ${subtleOptions.eyeshadowColor}.`);
            }
            if (subtleOptions.useEyebrows) {
                parts.push(`- Style the eyebrows to be: '${subtleOptions.eyebrowStyle}'.`);
            }
            if (subtleOptions.useEyeliner) {
                parts.push(`- Apply eyeliner in this style: '${subtleOptions.eyelinerStyle}'.`);
            }

            if (parts.length <= 1) {
                setError('Silakan pilih setidaknya satu opsi "Tipis-tipis" untuk diterapkan.');
                return;
            }
            finalPrompt = parts.join('\n');
        }


        setIsLoading(true);
        setError(null);
        setCurrentImage(null);

        try {
            const base64FaceData = imagePreview.split(',')[1];
            const result = await touchUpFace(base64FaceData, finalPrompt);
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat melakukan touch up.');
        } finally {
            setIsLoading(false);
        }
    }, [imagePreview, selectedTemplate, gender, touchUpOption, manualPrompt, subtleOptions]);

    const currentTemplates = touchUpTemplates[gender];
    
    const SubtleOption: React.FC<{
      id: 'removeBlemishes' | 'lipstick' | 'blushOn' | 'eyeshadow' | 'eyebrows' | 'eyeliner';
      label: string;
    }> = ({ id, label }) => {
        if (id === 'removeBlemishes') {
            return (
                 <div className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center">
                        <input id={`check-${id}`} type="checkbox" checked={subtleOptions.removeBlemishes} onChange={e => handleSubtleOptionChange('removeBlemishes', e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"/>
                        <label htmlFor={`check-${id}`} className="ml-3 block text-sm font-medium text-gray-300">{label}</label>
                    </div>
                </div>
            );
        }
    
        const useKey = `use${id.charAt(0).toUpperCase() + id.slice(1)}` as 'useLipstick' | 'useBlushOn' | 'useEyeshadow' | 'useEyebrows' | 'useEyeliner';
        const isChecked = subtleOptions[useKey];
        
        let valueInput: React.ReactNode = null;
        
        if (id === 'lipstick' || id === 'blushOn' || id === 'eyeshadow') {
            const colorKey = `${id}Color` as 'lipstickColor' | 'blushOnColor' | 'eyeshadowColor';
            const colorValue = subtleOptions[colorKey];
            valueInput = (
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                        <div className="w-full h-full rounded-md border border-gray-500" style={{ backgroundColor: colorValue }} aria-hidden="true" />
                        <input
                            type="color"
                            value={colorValue}
                            onChange={e => handleSubtleOptionChange(colorKey, e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            aria-label={`Color picker for ${label}`}
                        />
                    </div>
                    <span className="text-gray-400 font-mono text-xs">{colorValue}</span>
                </div>
            );
        } else if (id === 'eyebrows' || id === 'eyeliner') {
            const styleKey = id === 'eyebrows' ? 'eyebrowStyle' : 'eyelinerStyle';
            const styleValue = subtleOptions[styleKey];
            const options = id === 'eyebrows' ? eyebrowTemplates : eyelinerTemplates;
            valueInput = (
                <select value={styleValue} onChange={e => handleSubtleOptionChange(styleKey, e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        }
    
        return (
            <div className="p-3 bg-gray-800 rounded-lg space-y-2">
                <div className="flex items-center">
                    <input id={`check-${id}`} type="checkbox" checked={isChecked} onChange={e => handleSubtleOptionChange(useKey, e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-cyan-600 focus:ring-cyan-500"/>
                    <label htmlFor={`check-${id}`} className="ml-3 block text-sm font-medium text-gray-300">{label}</label>
                </div>
                {isChecked && (
                    <div className="pl-7">
                        {valueInput}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <FileUpload
                    onImageUpload={handleImageUpload}
                    title="1. Unggah Foto Wajah"
                    description="Unggah foto close-up untuk di-touch up."
                />

                {imageFile && (
                    <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold text-gray-200">2. Konfigurasi Touch Up</h3>
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
                            <label className="block text-sm font-medium text-gray-300 mb-2">Opsi Touch Up</label>
                            <div className={`grid ${gender === 'wanita' ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                                <button onClick={() => setTouchUpOption('template')} className={`py-2 text-sm rounded-md ${touchUpOption === 'template' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Template</button>
                                {gender === 'wanita' && (
                                    <button onClick={() => setTouchUpOption('subtle')} className={`py-2 text-sm rounded-md ${touchUpOption === 'subtle' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Tipis-tipis</button>
                                )}
                                <button onClick={() => setTouchUpOption('manual')} className={`py-2 text-sm rounded-md ${touchUpOption === 'manual' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Manual</button>
                            </div>
                        </div>

                        {touchUpOption === 'template' && (
                            <div>
                                <label htmlFor="template-touchup" className="block text-sm font-medium text-gray-300 mb-2">Pilih Template</label>
                                <select
                                    id="template-touchup"
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                >
                                    {currentTemplates.map(template => (
                                    <option key={template.name} value={template.value}>{template.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {touchUpOption === 'manual' && (
                            <div>
                                <label htmlFor="manual-prompt" className="block text-sm font-medium text-gray-300 mb-2">Deskripsi Manual</label>
                                <textarea
                                    id="manual-prompt"
                                    rows={3}
                                    value={manualPrompt}
                                    onChange={(e) => setManualPrompt(e.target.value)}
                                    className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                    placeholder="e.g., Apply bold red lipstick and smokey eyeshadow"
                                />
                            </div>
                        )}

                        {touchUpOption === 'subtle' && gender === 'wanita' && (
                            <div className="space-y-3">
                                <h4 className="text-md font-semibold text-gray-300">Opsi "Tipis-tipis"</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <SubtleOption id="removeBlemishes" label="Bersihkan Wajah" />
                                    <SubtleOption id="lipstick" label="Gunakan Lipstik" />
                                    <SubtleOption id="blushOn" label="Gunakan Blush On" />
                                    <SubtleOption id="eyeshadow" label="Gunakan Eyeshadow" />
                                    <SubtleOption id="eyebrows" label="Gaya Alis" />
                                    <SubtleOption id="eyeliner" label="Gaya Eyeliner" />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={!imageFile || isLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <FaceSmileIcon className="w-5 h-5" />}
                    {isLoading ? 'Processing...' : 'Touch Up Face'}
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
                            imageUrl={currentImage}
                            isLoading={isLoading}
                            onRegenerate={handleGenerate}
                            isStandalone={true}
                            title="Touched Up Result"
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

export default FaceTouchUp;
