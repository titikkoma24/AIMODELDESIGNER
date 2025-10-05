import React, { useState, useCallback, useEffect } from 'react';
import { editWithNanoBanana, improvePrompt } from '../services/geminiService';
import { lightStyles } from '../constants/backgroundTemplates';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { PhotoIcon, GenerateIcon, SparklesIcon } from './icons';
import Spinner from './Spinner';

const shotStyles = [
    "Original", "Product Shot", "Close-up", "Lifestyle Shot", "Flat Lay", "Eye-Level Shot", "High-Angle", "Low-Angle", "Dutch Angle"
];

const imageStyles = [
    { name: 'Pilih Style', description: 'Gunakan gaya rendering default.', promptValue: '' },
    { name: 'Realism (Realistis)', description: 'Gaya foto yang sangat mirip kenyataan.', promptValue: 'hyperrealistic photography' },
    { name: 'Cinematic Style', description: 'Gaya seperti adegan film dengan kontras dan tone dramatis.', promptValue: 'cinematic style' },
    { name: 'Minimalism (Minimalis)', description: 'Gaya sederhana dengan latar bersih dan elemen terbatas.', promptValue: 'minimalist style' },
    { name: 'Vintage Look', description: 'Gaya foto lama dengan tone warna hangat atau pudar.', promptValue: 'vintage film photography style' },
    { name: '3D Rendering / CGI', description: 'Gaya gambar yang terlihat seperti dibuat dengan software 3D.', promptValue: '3D render, CGI style' },
    { name: 'Watercolor Style (Cat Air)', description: 'Efek lembut seperti lukisan cat air.', promptValue: 'watercolor painting style' },
];

const themes = {
  Produk: [
    { name: 'Minimalist Clean', prompt: 'on a clean, minimalist podium with a solid soft-colored background, with soft studio lighting.' },
    { name: 'Luxury Marble', prompt: 'displayed on a luxurious black marble surface with elegant, dramatic side lighting.' },
    { name: 'Natural Wood', prompt: 'placed on a rustic wooden table, surrounded by natural elements like leaves or stones, with warm morning sunlight.' },
    { name: 'Floating Geometric', prompt: 'floating amidst abstract geometric shapes and platforms, with vibrant, colorful lighting.' },
    { name: 'Industrial Concrete', prompt: 'on a rough concrete block background, with strong, hard directional lighting creating sharp shadows.' },
    { name: 'Water Splash', prompt: 'in the center of a dynamic, frozen-in-time water splash, with bright, high-speed photography lighting.' },
    { name: 'Lush Foliage', prompt: 'nestled within lush, green tropical leaves and foliage, with dappled sunlight filtering through.' },
    { name: 'Cozy Fabric', prompt: 'sitting on a soft, textured fabric like silk or wool, with cozy, warm ambient light.' },
    { name: 'Tech Pedestal', prompt: 'on a glowing neon pedestal in a dark, futuristic setting with sharp blue and pink neon lights.' },
  ],
  Makanan: [
    { name: 'Rustic Farm Table', prompt: 'served on a rustic wooden farm table, surrounded by fresh ingredients, with warm, natural window light.' },
    { name: 'Dark & Moody Slate', prompt: 'on a dark slate plate, with dramatic, low-key side lighting that highlights textures.' },
    { name: 'Bright & Airy Picnic', prompt: 'as part of a vibrant picnic spread on a checkered blanket in a sunny park, with bright, airy lighting.' },
    { name: 'Elegant Fine Dining', prompt: 'plated artfully on a white ceramic dish in a fine dining setting, with soft, elegant overhead lighting.' },
    { name: 'Street Food Chaos', prompt: 'in a bustling, vibrant street food market at night, with the colorful glow of neon signs and food stalls.' },
    { name: 'Cozy Kitchen Counter', prompt: 'on a cozy kitchen counter with flour dusted around, with warm, inviting light from a nearby lamp.' },
    { name: 'Deconstructed Art', prompt: 'deconstructed on a clean surface, with ingredients artistically scattered, shot from a top-down flat lay perspective.' },
    { name: 'Action Shot', prompt: 'being drizzled with sauce or sprinkled with toppings, captured in a dynamic action shot with focused lighting.' },
    { name: 'Minimalist Color Pop', prompt: 'on a solid, brightly colored background that contrasts with the food, with clean, even studio lighting.' },
  ],
  Minuman: [
    { name: 'Tropical Beach Bar', prompt: 'in a frosted glass on a wooden beach bar counter, with a blurred tropical beach and ocean in the background during sunset.' },
    { name: 'Cozy Cafe Table', prompt: 'in a ceramic mug on a small cafe table next to a window on a rainy day, with soft, cozy interior lighting.' },
    { name: 'Elegant Speakeasy', prompt: 'in an ornate crystal glass on a dark, polished bar top in a dimly lit speakeasy, with a single spotlight.' },
    { name: 'Fresh & Fruity Splash', prompt: 'surrounded by splashing fresh fruits that match its ingredients, against a clean white background with bright lighting.' },
    { name: 'Icy Mountain Peak', prompt: 'in a chilled glass surrounded by ice cubes and frost, with a dramatic, cold mountain peak in the background.' },
    { name: 'Minimalist Studio', prompt: 'in a simple, elegant glass against a seamless, solid-colored studio background with crisp, clean lighting.' },
    { name: 'Garnished Close-up', prompt: 'in a detailed close-up shot focusing on the garnish (like a lemon twist or mint leaf), with soft, focused lighting.' },
    { name: 'Pouring Action', prompt: 'being poured into a glass, captured mid-stream with a high-speed photography effect.' },
    { name: 'Neon Reflection', prompt: 'on a reflective surface in a dark room, catching the vibrant reflections of neon signs.' },
  ]
};

type Category = keyof typeof themes;

const AestheticProductShot: React.FC = () => {
    const [sourceImage, setSourceImage] = useState<{ file: File; preview: string } | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [category, setCategory] = useState<Category>('Produk');
    const [selectedTheme, setSelectedTheme] = useState<string | null>(themes.Produk[0].prompt);
    const [selectedThemeName, setSelectedThemeName] = useState<string>(themes.Produk[0].name);
    const [shotStyle, setShotStyle] = useState<string>(shotStyles[0]);
    const [lightStyle, setLightStyle] = useState<string>(lightStyles[0].name);
    const [imageStyle, setImageStyle] = useState<string>(imageStyles[0].name);
    const [isLoading, setIsLoading] = useState(false);
    const [isImproving, setIsImproving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [lightStyleDescription, setLightStyleDescription] = useState<string>('');

    useEffect(() => {
        const selected = lightStyles.find(style => style.name === lightStyle);
        setLightStyleDescription(selected ? selected.description : '');
    }, [lightStyle]);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSourceImage({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setResultImage(null);
        setHistory([]);
        setError(null);
    };

    const handleThemeSelect = (theme: {name: string, prompt: string}) => {
        setSelectedTheme(theme.prompt);
        setSelectedThemeName(theme.name);
    }
    
    const handleImprovePrompt = useCallback(async () => {
        if (!prompt.trim()) return;
        setIsImproving(true);
        setError(null);
        try {
            const improved = await improvePrompt(prompt);
            setPrompt(improved);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to improve prompt.');
        } finally {
            setIsImproving(false);
        }
    }, [prompt]);

    const handleGenerate = useCallback(async () => {
        if (!sourceImage) {
            setError('Please upload an image first.');
            return;
        }

        let finalPrompt = "Take the main object from the uploaded photo and place it into a new scene based on this description: ";

        if (selectedTheme) {
            finalPrompt += `The main object is ${selectedTheme}`;
        }
        if (prompt.trim()) {
            finalPrompt += ` Additionally, ${prompt.trim()}.`;
        }

        const selectedImageStyle = imageStyles.find(s => s.name === imageStyle);
        if (selectedImageStyle && selectedImageStyle.promptValue) {
            finalPrompt += ` The final image should have a ${selectedImageStyle.promptValue}.`;
        }
        
        finalPrompt += " Ensure the product itself remains unchanged but is perfectly integrated with the new background and lighting. The result should be a high-quality commercial photograph with sharp details and realistic textures.";

        setIsLoading(true);
        setError(null);
        setResultImage(null);
        
        try {
            const base64Image = sourceImage.preview.split(',')[1];
            const result = await editWithNanoBanana(
                [base64Image],
                finalPrompt,
                shotStyle === 'Original' ? 'Product Shot' : shotStyle,
                lightStyle,
                '1:1',
                false,
                null,
                false
            );
            const newImage = `data:image/jpeg;base64,${result}`;
            setResultImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    }, [sourceImage, prompt, selectedTheme, shotStyle, lightStyle, imageStyle]);

    const CategoryButton: React.FC<{ name: Category }> = ({ name }) => (
        <button
          onClick={() => {
              setCategory(name);
              handleThemeSelect(themes[name][0]);
          }}
          className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${
              category === name ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {name}
        </button>
    );

    const ThemeButton: React.FC<{ theme: { name: string; prompt: string } }> = ({ theme }) => (
        <button
          onClick={() => handleThemeSelect(theme)}
          className={`w-full text-left p-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
              selectedThemeName === theme.name
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {theme.name}
        </button>
    );

    const canGenerate = sourceImage && !isLoading;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                <FileUpload
                    onImageUpload={handleImageUpload}
                    title="1. Unggah Foto Produk/Makanan/Minuman"
                    description="Unggah foto objek yang ingin Anda buat lebih estetis."
                />

                {sourceImage && (
                    <>
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">2. Pilih Kategori & Tema Display</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <CategoryButton name="Produk" />
                                <CategoryButton name="Makanan" />
                                <CategoryButton name="Minuman" />
                            </div>
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-700">
                                {themes[category].map(theme => (
                                    <ThemeButton key={theme.name} theme={theme} />
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">3. Tambahkan Detail (Opsional)</h3>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                                placeholder="cth: tambahkan efek asap, dengan beberapa potong lemon di sampingnya..."
                                disabled={isLoading || isImproving}
                            />
                            <button
                                onClick={handleImprovePrompt}
                                disabled={!prompt.trim() || isImproving || isLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-lg shadow-md hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
                            >
                                {isImproving ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
                                {isImproving ? 'Improving...' : 'AI Prompt Improvement'}
                            </button>
                        </div>
                        
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h3 className="text-lg font-semibold text-gray-200">4. Atur Gaya (Opsional)</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="shot-style" className="block text-sm font-medium text-gray-300 mb-2">Shot Style</label>
                                    <select id="shot-style" value={shotStyle} onChange={(e) => setShotStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                        {shotStyles.map(style => <option key={style} value={style}>{style}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="image-style-product" className="block text-sm font-medium text-gray-300 mb-2">Style Gambar</label>
                                    <select id="image-style-product" value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                        {imageStyles.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="light-style" className="block text-sm font-medium text-gray-300 mb-2">Light Style</label>
                                <select id="light-style" value={lightStyle} onChange={(e) => setLightStyle(e.target.value)} className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500">
                                    {lightStyles.map(style => <option key={style.name} value={style.name}>{style.name}</option>)}
                                </select>
                                {lightStyleDescription && <p className="text-xs text-gray-400 mt-2">{lightStyleDescription}</p>}
                            </div>
                        </div>

                    </>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                    {isLoading ? 'Generating...' : 'Buat Gambar Estetik'}
                </button>
            </div>
            
            {/* Right Column: Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                    <div className="flex flex-col">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Foto Asli</h3>
                        {sourceImage ? (
                            <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                                <img src={sourceImage.preview} alt="Uploaded preview" className="rounded-md max-w-full max-h-full object-contain shadow-lg" />
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
                            imageUrl={resultImage}
                            isLoading={isLoading}
                            onRegenerate={handleGenerate}
                            isStandalone={true}
                            title="Hasil Gambar"
                            error={error}
                        />
                    </div>
                </div>
                 {history.length > 0 && (
                    <div className="mt-auto pt-4 border-t border-gray-700">
                        <h4 className="text-lg font-semibold text-cyan-400 mb-3">Riwayat Generasi</h4>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2">
                            {history.map((histImg, index) => (
                                <div 
                                    key={index}
                                    className="flex-shrink-0 cursor-pointer"
                                    onClick={() => setResultImage(histImg)}
                                    role="button"
                                    aria-label={`Lihat riwayat item ${index + 1}`}
                                >
                                    <img 
                                        src={histImg} 
                                        alt={`Riwayat ${index + 1}`}
                                        className={`w-24 h-24 object-cover rounded-md border-2 transition-all ${resultImage === histImg ? 'border-cyan-400 scale-105' : 'border-transparent hover:border-gray-500'}`}
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

export default AestheticProductShot;
