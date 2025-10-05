import React, { useState, useCallback, useEffect } from 'react';
import { editWithNanoBanana } from '../services/geminiService';
import FileUpload from './FileUpload';
import ImageDisplay from './ImageDisplay';
import { GenerateIcon, XMarkIcon, PhotoIcon, ClipboardIcon, CheckIcon } from './icons';
import Spinner from './Spinner';
import { poseCoupleTemplates } from '../constants/poseCoupleTemplates';

type Style = 'vector' | 'studio' | 'linkedin' | 'blackwhite' | 'windofchange' | 'meandtoys' | 'rainyface' | 'closeupestetik' | 'actionfigure' | 'soccer' | 'selfie' | 'lamaran' | 'neonselfie' | 'miniatur' | 'diorama' | 'blackshoot' | 'extremecloseup' | 'darksmoke' | 'silhouette' | 'caricature' | 'restoration' | 'miniaturkendaraan' | 'restorasiwarna' | 'luxurymonokrom' | 'selfieidol' | 'naturaloutdoor' | 'drawing' | 'candidcloseup' | 'newborn' | 'toodler' | 'kidsphotostudio' | 'posecouple';

const soccerPoses = [
    "Berdiri tegak dengan satu kaki di atas bola, tangan di pinggul, menatap tajam ke kamera.",
    "Selebrasi gol dengan kedua tangan terangkat dan teriakan kemenangan.",
    "Dalam posisi menendang bola dengan kekuatan penuh, fokus pada ayunan kaki.",
    "Mengontrol bola di kakinya dengan sentuhan lembut, mata fokus pada bola.",
    "Menunjuk ke lambang klub di dada dengan bangga.",
    "Berpose memegang jersey baru dengan senyum percaya diri.",
    "Duduk santai di atas bola di tengah lapangan.",
    "Melakukan juggling bola dengan keseimbangan yang sempurna.",
    "Dalam pose berlari cepat, seolah-olah mengejar bola.",
    "Menyilangkan tangan di dada dengan ekspresi serius.",
];

const poseEmojis = ['🤛', '👍', '🤙', '🤞', '✌️', '🫰🏻', '🫵', '🙏', '🖕', '😆', '😜', '😝', '😳', '🫣', '🤫', '😬', '🤤', '🫶', '🤌', '🤝'];


const PromptKece: React.FC = () => {
    const [sourceImages, setSourceImages] = useState<{ file: File; preview: string }[]>([]);
    const [preserveFaceDetails, setPreserveFaceDetails] = useState<boolean>(true);
    const [gender, setGender] = useState<'wanita' | 'pria'>('wanita');
    const [selectedStyle, setSelectedStyle] = useState<Style>('vector');
    const [actionFigureName, setActionFigureName] = useState<string>('Naruto');

    // State for Soccer Style
    const [clubName, setClubName] = useState('Real Madrid');
    const [clubYear, setClubYear] = useState('2024');
    const [jerseyNumber, setJerseyNumber] = useState('10');
    const [jerseyName, setJerseyName] = useState('YOURNAME');
    const [selectedSoccerPose, setSelectedSoccerPose] = useState(soccerPoses[0]);
    const [finalSoccerPrompt, setFinalSoccerPrompt] = useState('');

    // State for Selfie Style
    const [selfieLocationOption, setSelfieLocationOption] = useState<'indonesia' | 'world' | 'custom'>('indonesia');
    const [customCountry, setCustomCountry] = useState<string>('');
    const [finalSelfiePrompt, setFinalSelfiePrompt] = useState('');

    // State for Job Application Style
    const [lamaranBackgroundColor, setLamaranBackgroundColor] = useState<string>('#ff0000');
    const [finalLamaranPrompt, setFinalLamaranPrompt] = useState('');
    
    // State for Diorama Style
    const [dioramaLighting, setDioramaLighting] = useState<'malam' | 'siang' | 'estetik'>('malam');
    const [finalDioramaPrompt, setFinalDioramaPrompt] = useState('');
    
    // State for Miniatur Kendaraan Style
    const [kendaraanModel, setKendaraanModel] = useState<string>('Custom Model');

    // State for Selfie with Idol Style
    const [selfieIdolName, setSelfieIdolName] = useState('Lionel Messi, Singer, Indonesian');
    const [selfieIdolBackgroundColor, setSelfieIdolBackgroundColor] = useState('#808080');
    const [selfieYourPose, setSelfieYourPose] = useState('pose confidently with a natural smile pose');
    const [selfieIdolPose, setSelfieIdolPose] = useState('standing pose with hand style 🫰🏻');
    const [finalSelfieIdolPrompt, setFinalSelfieIdolPrompt] = useState('');

    // State for Candid Close Up Style
    const [candidEyeColor, setCandidEyeColor] = useState<string>('#87ceeb');

    // State for New Born Style
    const [babyName, setBabyName] = useState<string>('Your Baby Name');
    const [birthDate, setBirthDate] = useState<string>('01 - 01 - 2024');

    // State for Kids Photo Studio Style
    const [kidsShirt, setKidsShirt] = useState('simple white short-sleeve t-shirt');
    const [kidsPants, setKidsPants] = useState('olive green cargo jogger pants');
    const [kidsShoes, setKidsShoes] = useState('mint green low-top sneakers with white soles');
    const [kidsAccessories, setKidsAccessories] = useState('a bright green digital watch on her left wrist');
    const [kidsBackgroundColor, setKidsBackgroundColor] = useState<string>('#d9ead3'); // A pastel green
    const [kidsExpression, setKidsExpression] = useState<string>('lucu');
    const [finalKidsStudioPrompt, setFinalKidsStudioPrompt] = useState('');

    // State for Pose Couple Style
    const [manPhoto, setManPhoto] = useState<{ file: File; preview: string } | null>(null);
    const [womanPhoto, setWomanPhoto] = useState<{ file: File; preview: string } | null>(null);
    const [selectedPoseTemplate, setSelectedPoseTemplate] = useState<(typeof poseCoupleTemplates)[0] | null>(null);


    const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleCopyToClipboard = (textToCopy: string) => {
        if (!textToCopy) return;
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopiedPrompt(true);
            setTimeout(() => setCopiedPrompt(false), 2000); // Reset after 2 seconds
        }, (err) => {
            console.error('Could not copy text: ', err);
        });
    };

    const vectorPrompt = `Create an image using a face that is 100% identical to the reference photo: A stylized portrait of a ${gender === 'wanita' ? 'woman' : 'man'}, from the neck up. The face is slightly tilted to the right, exposing part of the right ear.
The background should conform to the dress code but be darker.
Vector art, Flat Design, Pop Art Style
Indirect lighting, even light distribution
Close-up portrait, profile view
Clean lines, thick shadows, minimal detail in the background.
High quality 8K`;

    const studioPrompt = `Hyperrealistic cinematic editorial portrait (reference from uploaded photo *do not change the details of the face and hair in the slightest) ${gender === 'wanita' ? 'She' : 'He'} stands upright in a studio with natural lighting and background color that matches the type of clothing worn, surrounded by smoke (according to the color of the clothing) billowing under dramatic lighting behind the subject. Clothing (Adjust to the uploaded reference photo) *Perfect the pose with various themes such as cute/cool/natural/friendly with relaxed shoulders, confident expression.
*if the photo is not uploaded with the full body, improve the legs and pants so that they are wearing shoes/sandals. Create a hyperrealistic portrait, 8K, sharp focus, detailed textures, and cinematic lighting. High image quality. as if taken with a Canon EOS R5 camera.`;

    const linkedinPrompt = `Ultra-realistic professional portrait of a ${gender === 'wanita' ? 'woman' : 'man'} (according to the attached facial reference/photo), wearing a well-fitting formal suit (dark blue or black), a crisp white shirt, and a tie. Neat hairstyle *if wearing a hijab, make sure to match the hijab with a suitable color, well-groomed face, natural skin tone, and a strong jawline. The background should be a soft, blurry studio backdrop with neutral colors (grey, beige, or dark shades). Soft professional lighting will highlight the face, giving a confident and professional impression. High-resolution, DSLR-quality LinkedIn profile photo. 1:1 square aspect ratio`;

    const blackwhitePrompt = `Use the face in this photo for a black-and-white studio shoot. The lighting is soft and minimalist, creating sharp shadows and a moody atmosphere. The pose is relaxed, leaning slightly with one arm on the back of the chair, ${gender === 'wanita' ? 'her' : 'his'} face turned to the side. The background is plain, with a simple, modern aesthetic. Create hyperrealism, 8K, sharp focus, detailed textures, and cinematic lighting.`;
    
    const windOfChangePrompt = `A low-angle medium close-up shot of the person, skin and hair blowing in the wind, an intense and introspective expression looking up. Dramatic hard lighting from above-front creates deep shadows and highlights on the naturally windblown hair. The image is taken from the tips of the hair to the stomach or chest. Backlighting/rim light subtly frames the subject. giving a windblown effect that enhances the aesthetic of the hair. The background is lit with a warm orange gradient on the left that blends with a deep maroon/purple on the right. The color palette is high-contrast, cinematic, and moody with rich tones and a slight desaturation. 8K quality, super realistic.`;

    const meAndToysPrompt = `A ${gender === 'wanita' ? 'woman' : 'man'} wearing a shirt and pants (as in the uploaded photo) with a gentle expression, is holding an action figure that resembles him/herself, almost the same size as him/her. The action figure is wearing similar clothes, appears to be assembling parts or parts of an unfinished toy in the assembly. The toy display is arranged on a luxurious wooden table. In the background, a collection of other action figures can be seen on the shelf. provide natural lighting, but aesthetic. 8k Quality, sharp focus, high contrast, realistic`;
    
    const rainyFacePrompt = `A low-angle medium close-up shot of the person, wet skin and hair, intense and introspective expression looking up. Dramatic hard lighting from above creates deep shadows and highlights on the wet skin. The image is taken from the tips of the hair to the stomach or chest. Backlighting/rim light subtly defines the subject. Gives the effect of water droplets or splashes. The background is lit with a warm orange gradient on the left that blends with a deep maroon/purple on the right. The color palette is high-contrast, cinematic, and moody with rich tones and little desaturation. 8K quality, super realistic.`;
    
    const closeUpEstetikPrompt = `A hyper-realistic, cinematic editorial portrait of the person you're uploading. They stand upright in a studio with natural lighting and a background color that matches their clothing, with dramatic lighting behind the subject. Clothing: (As per the uploaded reference photo) Relaxed shoulders, a confident expression, and a slightly tilted head provide natural light to the face with contrasting details and colors. The scene is lit with a dramatic, warm backlight that creates a glow that matches the color of the clothing and soft fill light on the face. Create a hyper-realistic 8K portrait with sharp focus, detailed textures, and cinematic lighting. Professional`;

    const actionFigurePrompt = `A hyper-realistic 3D render, 3:4 ratio. A collectible action figure,(${actionFigureName}). (reference from uploaded photo *do not change the details of the face and hair in the slightest)`;

    const neonSelfiePrompt = `A cinematic neon close-up portrait of the person being uploaded. Pose with your head tilted slightly at a 45-degree angle, candid and confident, keeping your eyes off the camera, and show a natural, charming smile. Wear clothing that matches the reference photo. Apply dramatic neon lighting with strong blue and orange contrasts. Set against a dark teal gradient background. The camera angle is slightly low, cropping only the face and shoulders. This is a highly realistic, high-resolution photography style with a friendly and charming atmosphere.`;

    const miniaturBuildingPrompt = `A hyper-realistic, high-quality photograph of a miniature diorama. The diorama is a 100% accurate replica of the building and its surroundings from the uploaded photo, capturing every architectural detail, texture, and color. It's built with realistic materials like 3D-printed resin and acrylic, with detailed landscaping using miniature moss and sand. Warm, inviting miniature LED lights create a deep, atmospheric scene. The entire diorama is elegantly displayed on a luxurious marble table against a plain, soft, warm-colored background. The overall image has high contrast and sharp focus. Critically important: Any visible text from the original photo must be perfectly replicated, sharp focus, high contrast, realistic`;

    const blackshootPrompt = `An emotional cinematic portrait of myself, featuring myself with my head slightly tilted, wearing a shirt and trousers as shown in the uploaded photo. The warm golden blue light isolates ${gender === 'wanita' ? 'her' : 'him'} from the dark void, softly illuminating ${gender === 'wanita' ? 'her' : 'his'} hair, capturing the profound stillness. However, ${gender === 'wanita' ? 'her' : 'his'} face remains visible. High quality, sharp facial details, and realistic. Taken with a CANON EOS R5 camera.`;

    const extremeCloseUpPrompt = `Create a very close-up of the face, focusing especially on the eyes, and only showing half of the face, leaving the hair down to the chin on the right side of the face visible. Make the pores of the skin very visible with high contrast. and dramatically enhance this image to very high detail. Sharpen every texture, clarify reflections, perfect the lighting, and bring out small details to create a very sharp and high-fidelity result, so that the cornea of the eye is clearly visible. The photo was taken using a Canon EF 100mm f/2.8L Macro IS USM macro lens. Ensure the face is very realistic and the pores of the skin are clearly visible., sharp focus, high contrast, realistic`;

    const darkSmokePrompt = `Hands in Pockets – Relaxed Authority. A hyper-realistic, cinematic editorial portrait of the person being uploaded. They stand upright in a dark, gloomy studio, surrounded by billowing smoke under dramatic lighting. Clothing: As per the uploaded reference photo. Both hands are casually tucked into their pockets, shoulders relaxed, a confident expression, and the head is slightly tilted. Make it hyper-realistic, 8k, sharp focus, detailed textures, cinematic lighting., sharp focus, high contrast, realistic`;

    const silhouettePrompt = `A hyperrealistic, minimalist black-and-white portrait of a ${gender === 'wanita' ? 'woman' : 'man'} (based on the uploaded reference), facing 90 degrees to the side, away from the camera, with soft light behind ${gender === 'wanita' ? 'her' : 'him'}. ${gender === 'wanita' ? 'Her' : 'His'} expression is intense and mysterious. The dramatic lighting creates strong shadows. With a photorealistic, cinematic vertical shot (9:16), sharp focus`;

    const caricaturePrompt = `Create a captivating, laughter-filled, and highly expressive digital caricature portrait. Transform the subject into a unique and intriguing representation, where their most prominent facial features—such as the nose, eyes, lips, chin, or even a distinctive hairstyle—are exaggerated intelligently, absurdly, and artistically. Despite the exaggeration, ensure the subject's likeness remains instantly recognizable, yet with a distilled and iconic visual style, resembling a high-quality modern cartoon portrait.

*Artistic Style & Details:* Visualize in a contemporary digital illustration style, resembling high-end animation studio concept art (like Pixar, DreamWorks, or modern magazine illustration style). Use clean, expressive, and sometimes bold lines to define forms. Small details in facial expressions—playful crinkles around the eyes, a mischievous glint, or a cheeky smile—should be emphasized. Add simplified yet palpable texture, such as subtle creases in clothing or dynamically flowing hair details, to add depth without distracting from the main focus.

*Color Palette:* Apply a bright, cheerful, and vibrant color palette. Use high yet harmonious saturation, with smooth color gradients and soft tonal transitions to add volume and dimension. Dominate with eye-catching primary and secondary colors (e.g., bright red, cheerful yellow, electric blue), or clever complementary color schemes to create delightful, pop-art contrast. Avoid dull or dark colors; every pigment should radiate positive energy.

*Lighting & Shadows:* Employ a dramatic yet playful lighting scheme, specifically designed to highlight the exaggerated facial features. Consider soft studio lighting from the front to accentuate expressions, or clever side-lighting to create artistic depth and shadows. Add a subtle, sparkling rim light effect around the subject's silhouette to separate them from the background and add definition. Shadows should be intelligent, minimalist, and strategically used to add dimension without appearing gloomy or distracting from the visual humor. Highlights should be clear and deliberately placed to draw the eye to key features.

*Composition & Background:* The composition should be a close-up shoulder-up portrait or headshot, focusing full and undivided attention on the subject's face and expression. The viewpoint should be dynamic, perhaps with a slight camera tilt or a clever eye-level perspective, to add a sense of playfulness and energy. The background should be minimalist, clean, and non-distracting, perhaps a soft solid color gradient, a very simple abstract pattern, or a gently contrasting color field that serves as a canvas, supporting the caricature without competing with it. Ensure negative space is effectively used to frame the subject.

*Quality & Mood:* The final output must have very high resolution (minimum 4K, ideally 8K), with exceptionally clean, sharp, and professional rendering. The primary focus should be perfectly sharp on the exaggerated features. Capture the essence of the subject's personality with a cheerful, goofy, or witty expression, radiating an aura of joy, intelligent humor, and positive energy. The image should feel alive, dynamic, and exude an undeniable appeal, inviting a wide smile from anyone who views it., sharp focus, high contrast, realistic`;

    const restorationPrompt = `Edit this photo into a high-quality color photo, comparable to the results of a Canon EOS R5.

Subject (Main Focus):
Keep the subject's entire body in the frame, with natural proportions.
Keep the original facial features (eyes, nose, lips, eyebrows, and contours) accurate.

Skin:
Enhance it to look smooth, bright, healthy, and natural, free from blemishes.

Hair:
Make it look shiny and healthy (ignore if covered by a hijab).

Clothing:
Maintain the same style, cut, and color.
Enhance texture and detail to look fresh, premium, and refined.

Lighting & Visual Quality:
Apply soft, bright, and even studio lighting from the front (similar to a beauty dish or ring light).
Ensure the image is sharp, clear, noise-free, with balanced contrast, realistic reflections, and natural tones.
Enhance depth, detail, and richness in skin, fabrics, and the overall composition.

Avoid distracting textures; focus on the subject to make it stand out.
Use pixel enhancement if the original photo is blurry, dark, or grainy.
Adjust poses, body shapes, or clothing only if necessary for optimal realistic results. If there are any watermarks, please help me remove them. Also, crop out any unnecessary outlines and borders.`;
    
    const restorasiWarnaPrompt = `Edit this photo into a very high-quality professional studio portrait, comparable to the results of a Canon EOS R5.

Subject (Primary Focus):
Keep the subject's full body in the frame, with natural proportions.
Keep the original facial features (eyes, nose, lips, eyebrows, and contours) accurate.

Skin:
Enhance it to look smooth, bright, healthy, and natural, free from blemishes.

Hair:
Make it look shiny and healthy (ignore if covered by a hijab).

Clothing:
Maintain the same style, cut, and color.
Enhance texture and detail to look fresh, premium, and polished.

Lighting & Visual Quality:
Apply soft, bright, and even studio lighting from the front (similar to a beauty dish or ring light).
Ensure the image is sharp, clear, noise-free, with balanced contrast, realistic reflections, and natural tones.
Enhance the depth, detail, and richness of the skin, fabrics, and overall composition.

Background (Atmosphere):
Replace the background with a clean, solid, and elegant professional studio backdrop.
Avoid distracting textures; focus on the subject for clarity.
Use pixel enhancement if the original photo is blurry, dark, or grainy.
Adjust poses, body shapes, or clothing only if necessary for optimal realistic results. If there are watermarks, please help me remove them. Also, crop out any unnecessary outlines and borders.`;

    const miniaturKendaraanPrompt = `Transform this photo into a 1:64 scale die-cast Hot Wheels toy. Make it incredibly realistic and detailed in every aspect, as if it were a shiny, luxurious, and premium new toy. Display this toy in a luxurious Hot Wheels blister pack with a transparent plastic cover, securely sealed. Hang this package on a single hook in the toy aisle of a supermarket. Ensure only this particular model is displayed. Provide soft, natural lighting, as if from a supermarket lamp. At the bottom of the package, label the car model: (${kendaraanModel}). The image quality should be very sharp (8k, sharp focus). Create a 1:1, square image.`;

    const luxuryMonokromPrompt = `Use the face in this photo for a black-and-white studio shoot. The lighting is soft and minimalist, creating sharp shadows and a moody atmosphere. The pose is relaxed, leaning slightly with one arm on the back of the chair, ${gender === 'wanita' ? 'her' : 'his'} face turned to the side. The background is plain, with a simple, modern aesthetic. Create hyperrealism, 8K, sharp focus, detailed textures, and cinematic lighting., sharp focus, high contrast, realistic`;
    
    const naturalOutdoorPrompt = `Generate a virtual image using 100% of the facial features as in the attached image. The ${gender === 'wanita' ? 'girl' : 'man'} is wearing a (reference photo), sitting on one of the white steps as ${gender === 'wanita' ? 'she' : 'he'} descends, facing the camera. ${gender === 'wanita' ? 'She' : 'He'} is bathed in warm, golden sunlight, which casts long shadows on the white wall behind her. ${gender === 'wanita' ? 'Her' : 'His'} face is captivating, ${gender === 'wanita' ? 'beautiful' : 'handsome'}, sweet, and cool. Sharp 8K image.`;

    const drawingPrompt = `A highly detailed, realistic black and white pencil sketch of the person in the reference image, rendered with high contrast and dark shading on clean white drawing paper with visible texture. The lower part of their portrait transitions from a finished drawing into rough, visible sketch lines.`;

    const candidCloseUpPrompt = `Use my photo to create a close-up portrait of a young ${gender === 'wanita' ? 'woman' : 'man'} with the hairstyle seen in the reference photo. *If wearing a hijab, make sure it's a hijab for women. Their skin tone is warm, and their eyes are a plain color with hex code ${candidEyeColor}, looking off to the side, suggesting a pensive or slightly melancholy expression.

Their hands are clasped just below their chin and mouth, with their fingers touching their lower lip and jawline, drawing focus to their contemplative gaze.

The lighting is dramatic, with strong natural light highlighting the left side of their face and hair, creating a stark contrast with the darker, shadowed background and the right side of their face. This use of light and shadow lends a moody and intimate feel to the image.

Overall, the photograph captures a moment of quiet introspection.`;

    const newBornPrompt = `buatkan berbagai tema Pemotretan bayi baru lahir dengan berbagai properti dan pose, baik sedang tertidur, duduk, buatkan pose dan tema photshoot yang random , dengan referensi photo bayi yang diunggah, pastikan tidak merubah detail wajah dan rambutnya . hasil generate style ini , buatkan 1 photo dengan 4 tema newborn photoshoot. berikan custom text berupa nama bayi ${babyName} dan tanggal bulan dan tahun lahir ${birthDate}`;

    const toodlerPrompt = `**Primary Goal:** Create a single 1:1 square photo containing a grid of 6 different toddler photoshoots.

**UNBREAKABLE CORE RULE: ABSOLUTE FACE IDENTITY PRESERVATION (100% SIMILARITY).**
- This is the most critical instruction and must be followed without exception for all 6 poses.
- You are explicitly and absolutely forbidden from altering the toddler's facial details in any way.
- The face from the uploaded reference photo must be preserved with 100% perfect accuracy across all 6 generated images, even with different expressions.
- Maintain every unique feature, proportion, and the exact hair from the original photo.
- Any deviation, no matter how small, is a failure. Treat this as a face-swapping task: you are taking the *identity* from the photo and applying it to new poses and outfits.

**Photoshoot Theme & Style:**
- **Subject:** A toddler aged 3-5 years.
- **Background:** A plain, bright, and colorful photo studio background for all 6 images.
- **Poses:** Generate 6 different, random, cute, and natural toddler poses (e.g., sitting, laughing, playing with a toy, looking curious).
- **Outfits (Dress Code):** Provide 6 different, bright, colorful, cute, and adorable outfits, one for each pose.
- **Lighting:** Use soft, bright lighting typical of a professional photo studio.

**Final Image Quality:**
- **Composition:** A single square image (1:1 aspect ratio) that combines all 6 photoshoot results into a collage.
- **Quality:** The final image must be very detailed, sharp, and in 8K quality.`;


    const generateSelfieIdolPrompt = useCallback(() => {
        return `A selfie of the person from the **first** uploaded photo with their idol, ${selfieIdolName}, whose face must be 100% identical to the **second** uploaded image. Improve idol dresscode. The person from the first photo's pose is: ${selfieYourPose}. The idol's pose is: ${selfieIdolPose}. *Make sure not to change the facial details from the uploaded photo references. They are in a narrow room with a plain, solid colored background of hex color ${selfieIdolBackgroundColor}. Shooting mode from above. The photo was taken using a CANON EOS r5 DSLR camera. very sharp quality. and high contrast. 8K.`;
    }, [selfieIdolName, selfieIdolBackgroundColor, selfieYourPose, selfieIdolPose]);

    const generateDioramaPrompt = useCallback(() => {
        let lightingDescription = '';
        switch (dioramaLighting) {
            case 'malam':
                lightingDescription = 'The scene is set at night, with dramatic, atmospheric lighting from miniature LEDs illuminating the structure and creating deep shadows.';
                break;
            case 'siang':
                lightingDescription = 'The scene is brightly lit as if under a clear daytime sky, with soft, natural-looking shadows that define the architectural details.';
                break;
            case 'estetik':
                lightingDescription = 'The scene is bathed in aesthetic lighting, such as golden hour tones or a soft, colorful ambient glow, to create a visually artistic and captivating mood.';
                break;
        }

        return `Create a hyper-realistic photograph of a miniature diorama displayed on a table. The diorama is a faithful recreation of the building or monument from the uploaded photo, capturing its essence as an iconic landmark. The composition must focus solely on the diorama, removing any original background such as the sky. ${lightingDescription} The final image must have sharp focus and intricate, high-quality details in every corner. The image should emulate a shot taken with a professional DSLR camera, resulting in a hyper-realistic, 8k, 16:9 landscape photograph., sharp focus, high contrast, realistic.`;
    }, [dioramaLighting]);

    const generateSoccerPrompt = useCallback(() => {
       return `Seorang pemain sepak bola profesional baru untuk klub ${clubName} ${clubYear} diperkenalkan ke media. Dia adalah orang dari foto wajah yang diunggah, mengenakan jersey lengkap yang cocok dengan foto jersey yang diunggah, lengkap dengan nama "${jerseyName}" dan nomor "${jerseyNumber}" di punggung. Posenya adalah ${selectedSoccerPose}. Dia berada di tengah lapangan sepak bola yang sangat detail dengan rumput hijau subur. Pencahayaannya adalah sinar matahari sore, menciptakan bayangan panjang, di bawah langit biru jernih dengan beberapa awan putih. Foto ini hiper-realistis, kualitas 8k, sinematik.`;
    }, [clubName, clubYear, jerseyName, jerseyNumber, selectedSoccerPose]);

    const generateSelfiePrompt = useCallback(() => {
        let location = 'Indonesia';
        if (selfieLocationOption === 'world') {
            location = 'world';
        } else if (selfieLocationOption === 'custom' && customCountry.trim()) {
            location = customCountry.trim();
        }

        return `Confident selfie of the uploaded person (*do not change any facial details, ensure 100% similarity to the reference face/photo uploaded), taken at a famous tourist destination in (${location}). AI must creatively select beautiful and iconic locations in (${location}). The person's clothing must be stylish and appropriate for the chosen location. Lighting must be natural and captivating. 8K quality, super realistic, sharp focus, high contrast, realistic. The photo was taken as if using a professional CANON EOS R5 camera.`;
    }, [selfieLocationOption, customCountry]);
    
    const generateLamaranPrompt = useCallback(() => {
        const basePrompt = `**TASK: Transform the uploaded photo into a professional job application photo.**

**COMPOSITION & STYLE:**
- **Framing:** The final photo MUST be a close-up from the chest up.
- **Expression:** The subject should have a neutral expression or a very subtle, professional smile.
- **Background:** The background MUST be a solid, plain color with the hex code ${lamaranBackgroundColor}.
- **Lighting & Quality:** Use soft, even studio lighting. Skin tones should be natural. The photo should be high-resolution, sharp, and look like a professional photo. No artistic filters.
- **Aspect Ratio:** The final photo's aspect ratio MUST be 3:4.

**FACE KEY (ABSOLUTE RULE):**
The person's face must be 100% identical to the uploaded photo. Do not alter facial details, enhance facial brightness, and remove blemishes such as acne.`;

        if (gender === 'pria') {
            return `
**SUBJECT & CLOTHING (IMPORTANT):**
- Keep his original hairstyle but make it look neat and professional. He MUST be wearing a formal white shirt.

${basePrompt}`;
        } else { // wanita
            return `
**SUBJECT & CLOTHING (IMPORTANT):**
- **For Women Wearing Hijab:** If the original photo shows a woman wearing a hijab, transform it into a neat, simple, and plain black hijab. She MUST be wearing a white collared blouse underneath.
- **For Women Without Hijab:** If the original photo shows a woman not wearing a hijab, keep her original hairstyle but make it look neat and professional. She MUST be wearing a white collared blouse.

${basePrompt}`;
        }
    }, [gender, lamaranBackgroundColor]);

    const generateKidsStudioPrompt = useCallback(() => {
        const angles = ['eye-level shot', 'slightly low angle shot', 'slightly high angle shot'];
        const randomAngle = angles[Math.floor(Math.random() * angles.length)];
    
        return `A young ${gender === 'wanita' ? 'girl' : 'boy'}, smiling gently with a ${kidsExpression} expression, looking directly at the viewer. CRITICAL: The facial details, likeness, and hair style must be preserved 100% from the provided source image, with absolutely no alterations to the face or hair. The child is wearing: ${kidsShirt}, ${kidsPants}, and ${kidsShoes}. They are also wearing ${kidsAccessories}. The child sits upright in a stylish, professional, and random model-like pose on a clean square pedestal. The pedestal's color is a solid color with hex code ${kidsBackgroundColor}, matching the background. The composition is a centered medium shot against a solid background of the same hex color ${kidsBackgroundColor}. The camera angle is a ${randomAngle}. Use soft, even, diffused studio lighting to create a clean, minimalist, product photography aesthetic. 8k quality, hyperrealistic, sharp details.`;
    }, [gender, kidsShirt, kidsPants, kidsShoes, kidsAccessories, kidsBackgroundColor, kidsExpression]);


    useEffect(() => {
        if (selectedStyle === 'soccer') {
            setFinalSoccerPrompt(generateSoccerPrompt());
        }
    }, [selectedStyle, generateSoccerPrompt]);

    useEffect(() => {
        if (selectedStyle === 'selfie') {
            setFinalSelfiePrompt(generateSelfiePrompt());
        }
    }, [selectedStyle, generateSelfiePrompt]);

    useEffect(() => {
        if (selectedStyle === 'lamaran') {
            setFinalLamaranPrompt(generateLamaranPrompt());
        }
    }, [selectedStyle, generateLamaranPrompt]);

    useEffect(() => {
        if (selectedStyle === 'diorama') {
            setFinalDioramaPrompt(generateDioramaPrompt());
        }
    }, [selectedStyle, generateDioramaPrompt]);

     useEffect(() => {
        if (selectedStyle === 'selfieidol') {
            setFinalSelfieIdolPrompt(generateSelfieIdolPrompt());
        }
    }, [selectedStyle, generateSelfieIdolPrompt]);

    useEffect(() => {
        if (selectedStyle === 'kidsphotostudio') {
            setFinalKidsStudioPrompt(generateKidsStudioPrompt());
        }
    }, [selectedStyle, generateKidsStudioPrompt]);

    const styleConfig = {
        vector: { title: 'Style Vektor', prompt: vectorPrompt },
        studio: { title: 'Photo Studio', prompt: studioPrompt },
        linkedin: { title: 'Photo Linkedin', prompt: linkedinPrompt },
        lamaran: { title: 'Photo Lamaran Kerja', prompt: finalLamaranPrompt },
        blackwhite: { title: 'Black & White', prompt: blackwhitePrompt },
        windofchange: { title: 'Wind Of Change', prompt: windOfChangePrompt },
        meandtoys: { title: 'Me & Toys', prompt: meAndToysPrompt },
        rainyface: { title: 'Rainy Face', prompt: rainyFacePrompt },
        closeupestetik: { title: 'Close Up Estetik', prompt: closeUpEstetikPrompt },
        actionfigure: { title: 'Action figure', prompt: actionFigurePrompt },
        soccer: { title: 'Soccer Style', prompt: finalSoccerPrompt },
        selfie: { title: 'Selfie Keliling Dunia', prompt: finalSelfiePrompt },
        selfieidol: { title: 'Selfie with Idol', prompt: finalSelfieIdolPrompt },
        neonselfie: { title: 'Neon estetik Selfie', prompt: neonSelfiePrompt },
        miniatur: { title: 'Miniatur Building', prompt: miniaturBuildingPrompt },
        miniaturkendaraan: { title: 'Miniatur kendaraan ku', prompt: miniaturKendaraanPrompt },
        diorama: { title: 'Diorama', prompt: finalDioramaPrompt },
        blackshoot: { title: 'Black shoot Estetik', prompt: blackshootPrompt },
        extremecloseup: { title: '1/2 Extreme Close Up Face', prompt: extremeCloseUpPrompt },
        darksmoke: { title: 'Dark Smoke Estetik', prompt: darkSmokePrompt },
        silhouette: { title: 'silhouette', prompt: silhouettePrompt },
        caricature: { title: 'Caricature', prompt: caricaturePrompt },
        restoration: { title: 'Restoration Old Photos', prompt: restorationPrompt },
        restorasiwarna: { title: 'Restorasi photo rusak ( khusus photo berwarna )', prompt: restorasiWarnaPrompt },
        luxurymonokrom: { title: 'Luxury Monokrom', prompt: luxuryMonokromPrompt },
        naturaloutdoor: { title: 'Natural outdor', prompt: naturalOutdoorPrompt },
        drawing: { title: 'Drawing', prompt: drawingPrompt },
        candidcloseup: { title: 'Candid Close Up', prompt: candidCloseUpPrompt },
        newborn: { title: 'New Born Photoshot', prompt: newBornPrompt },
        toodler: { title: 'Toodler Photoshot Studio', prompt: toodlerPrompt },
        kidsphotostudio: { title: 'Kids Photo Studio', prompt: finalKidsStudioPrompt },
        posecouple: { title: 'Pose Couple', prompt: '' },
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

    const handleManPhotoUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setManPhoto({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setCurrentImage(null);
        setHistory([]);
        setError(null);
    };

    const handleWomanPhotoUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setWomanPhoto({ file, preview: reader.result as string });
        };
        reader.readAsDataURL(file);
        setCurrentImage(null);
        setHistory([]);
        setError(null);
    };

    const removeImage = (indexToRemove: number) => {
        setSourceImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleGenerate = useCallback(async () => {
        if (selectedStyle === 'posecouple') {
            if (!manPhoto || !womanPhoto || !selectedPoseTemplate) {
                setError('Please upload photos for the man, woman, and select a pose template.');
                return;
            }
        } else {
            const requiredImages = selectedStyle === 'selfieidol' ? 2 : 1;
            if (sourceImages.length < requiredImages) {
                setError(`Please upload at least ${requiredImages} image(s) for this style.`);
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        setCurrentImage(null);
        
        let promptToUse = '';
        let base64Images: string[] = [];
        let finalPreserveFaceDetails = preserveFaceDetails;

        if (selectedStyle === 'posecouple' && manPhoto && womanPhoto && selectedPoseTemplate) {
            promptToUse = `CRITICAL INSTRUCTION: This is a face swap and hair swap task. The first image provided is the main pose template. The second image is the face and hair reference for the woman. The third image is the face and hair reference for the man.

YOUR TASK:
1. Replace the face and hair of the man in the first image (pose template) with the face and hair from the third image.
2. Replace the face and hair of the woman in the first image (pose template) with the face and hair from the second image.
3. UNBREAKABLE RULE: You MUST preserve the exact facial identity and hair style from the reference photos (second and third images) with 100% accuracy and consistency. Any deviation is a failure.
4. Do NOT change the pose, clothing, lighting, or background from the first image (the pose template). Only swap the faces and hair.`;
            
            base64Images = [
                selectedPoseTemplate.src.split(',')[1],
                womanPhoto.preview.split(',')[1],
                manPhoto.preview.split(',')[1]
            ];
            finalPreserveFaceDetails = false; // The prompt handles face preservation explicitly
        } else {
            promptToUse = styleConfig[selectedStyle].prompt;
            base64Images = sourceImages.map(img => img.preview.split(',')[1]);
        }
        
        try {
            const result = await editWithNanoBanana(
                base64Images,
                promptToUse,
                'Original', // shotStyle
                'Original', // lightStyle
                'Original', // aspectRatio
                finalPreserveFaceDetails,
                null, // maskBase64
                false // hasMaskedReference
            );
            
            const newImage = `data:image/jpeg;base64,${result}`;
            setCurrentImage(newImage);
            setHistory(prev => [newImage, ...prev].slice(0, 10));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    }, [sourceImages, manPhoto, womanPhoto, selectedPoseTemplate, preserveFaceDetails, selectedStyle, gender, styleConfig, babyName, birthDate]);

    const isGenderRelevant = !['miniatur', 'diorama', 'caricature', 'restoration', 'miniaturkendaraan', 'restorasiwarna', 'selfieidol', 'drawing', 'newborn', 'toodler', 'posecouple'].includes(selectedStyle);
    
    const handleEmojiClick = (emoji: string, target: 'you' | 'idol') => {
        if (target === 'you') {
            setSelfieYourPose(prev => prev + emoji);
        } else {
            setSelfieIdolPose(prev => prev + emoji);
        }
    };


    const renderUploadPreviews = () => {
        if (selectedStyle === 'selfieidol') {
             return (
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-1 text-center">1. Wajah Anda</h4>
                        {sourceImages[0] ? (
                            <img src={sourceImages[0].preview} alt="Your face" className="rounded-md w-full object-contain shadow-lg" />
                        ) : <div className="h-24 bg-gray-700/50 rounded-md flex items-center justify-center text-gray-500 text-xs">Upload...</div>}
                    </div>
                    <div>
                         <h4 className="text-sm font-semibold text-gray-300 mb-1 text-center">2. Wajah Idol</h4>
                         {sourceImages[1] ? (
                            <img src={sourceImages[1].preview} alt="Idol's face" className="rounded-md w-full object-contain shadow-lg" />
                        ) : <div className="h-24 bg-gray-700/50 rounded-md flex items-center justify-center text-gray-500 text-xs">Upload...</div>}
                    </div>
                </div>
             )
        }
        return (
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
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Controls */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl">
                
                { selectedStyle !== 'posecouple' && (
                    <FileUpload
                        onImageUpload={handleImageUpload}
                        title="1. Unggah Foto"
                        description="Unggah foto wajah untuk subjek utama dan foto lain jika diperlukan (jersey, bangunan, kendaraan)."
                    />
                )}
                
                {sourceImages.length > 0 && selectedStyle !== 'posecouple' && (
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3">Foto yang Diunggah ({sourceImages.length})</h3>
                        {renderUploadPreviews()}
                    </div>
                )}
                
                <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-3">2. Pilih Style</h3>
                     <select
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value as Style)}
                        className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                    >
                        <option value="posecouple">Pose Couple</option>
                        <option value="vector">Style Vektor</option>
                        <option value="studio">Photo Studio</option>
                        <option value="linkedin">Photo Linkedin</option>
                        <option value="lamaran">Photo Lamaran Kerja</option>
                        <option value="kidsphotostudio">Kids Photo Studio</option>
                        <option value="blackwhite">Black & White</option>
                        <option value="luxurymonokrom">Luxury Monokrom</option>
                        <option value="windofchange">Wind Of Change</option>
                        <option value="meandtoys">Me & Toys</option>
                        <option value="rainyface">Rainy Face</option>
                        <option value="closeupestetik">Close Up Estetik</option>
                        <option value="neonselfie">Neon estetik Selfie</option>
                        <option value="miniatur">Miniatur Building</option>
                        <option value="miniaturkendaraan">Miniatur kendaraan ku</option>
                        <option value="diorama">Diorama</option>
                        <option value="blackshoot">Black shoot Estetik</option>
                        <option value="extremecloseup">1/2 Extreme Close Up Face</option>
                        <option value="darksmoke">Dark Smoke Estetik</option>
                        <option value="silhouette">silhouette</option>
                        <option value="caricature">Caricature</option>
                        <option value="restoration">Restoration Old Photos</option>
                        <option value="restorasiwarna">Restorasi photo rusak ( khusus photo berwarna )</option>
                        <option value="actionfigure">Action figure</option>
                        <option value="soccer">Soccer Style</option>
                        <option value="selfie">Selfie Keliling Dunia</option>
                        <option value="selfieidol">Selfie with Idol</option>
                        <option value="naturaloutdoor">Natural outdor</option>
                        <option value="drawing">Drawing</option>
                        <option value="candidcloseup">Candid Close Up</option>
                        <option value="newborn">New Born Photoshot</option>
                        <option value="toodler">Toodler Photoshot Studio</option>
                    </select>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg space-y-4 border border-cyan-500/50">
                    <h3 className="text-lg font-semibold text-cyan-400">{styleConfig[selectedStyle].title}</h3>
                     {isGenderRelevant && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Pilih Gender Subjek
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setGender('wanita')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${gender === 'wanita' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Wanita</button>
                                <button onClick={() => setGender('pria')} className={`w-full py-2 text-sm font-medium rounded-md transition-colors ${gender === 'pria' ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Pria</button>
                            </div>
                        </div>
                     )}

                    {selectedStyle === 'posecouple' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FileUpload onImageUpload={handleManPhotoUpload} title="1. Unggah Wajah Pria" description="Wajah & rambut pria." />
                                <FileUpload onImageUpload={handleWomanPhotoUpload} title="2. Unggah Wajah Wanita" description="Wajah & rambut wanita." />
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-gray-300">3. Pilih Template Pose</h4>
                                <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-y-auto p-2 bg-gray-900/50 rounded-lg">
                                    {poseCoupleTemplates.map(template => (
                                        <img 
                                            key={template.id} 
                                            src={template.src} 
                                            alt={`Pose ${template.id}`}
                                            onClick={() => setSelectedPoseTemplate(template)}
                                            className={`cursor-pointer rounded-md border-4 transition-all ${selectedPoseTemplate?.id === template.id ? 'border-cyan-400' : 'border-transparent hover:border-gray-600'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : selectedStyle === 'actionfigure' ? (
                        <div className="mt-2">
                            <label htmlFor="action-figure-name" className="block text-sm font-medium text-gray-300 mb-2">
                                Nama Karakter Action Figure
                            </label>
                            <input
                                type="text"
                                id="action-figure-name"
                                value={actionFigureName}
                                onChange={(e) => setActionFigureName(e.target.value)}
                                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="cth: Naruto, Iron Man, dll."
                            />
                        </div>
                    ) :
                    
                    selectedStyle === 'miniaturkendaraan' ? (
                        <div className="mt-2">
                            <label htmlFor="kendaraan-model-name" className="block text-sm font-medium text-gray-300 mb-2">
                                Nama Model Kendaraan
                            </label>
                            <input
                                type="text"
                                id="kendaraan-model-name"
                                value={kendaraanModel}
                                onChange={(e) => setKendaraanModel(e.target.value)}
                                className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                placeholder="cth: Lamborghini Aventador"
                            />
                        </div>
                    ) : selectedStyle === 'candidcloseup' ? (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-300">Candid Close Up Options:</h4>
                            <div>
                                <label htmlFor="candid-eye-color" className="block text-sm font-medium text-gray-400 mb-1">
                                    Warna Mata
                                </label>
                                 <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        id="candid-eye-color"
                                        value={candidEyeColor}
                                        onChange={(e) => setCandidEyeColor(e.target.value)}
                                        className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                                    />
                                    <span className="font-mono text-gray-400">{candidEyeColor}</span>
                                </div>
                            </div>
                        </div>
                    ) : selectedStyle === 'newborn' ? (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-300">New Born Photo Details:</h4>
                            <div>
                                <label htmlFor="baby-name" className="block text-sm font-medium text-gray-400 mb-1">Nama Bayi</label>
                                <input
                                    type="text"
                                    id="baby-name"
                                    value={babyName}
                                    onChange={(e) => setBabyName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"
                                    placeholder="Masukkan nama bayi"
                                />
                            </div>
                            <div>
                                <label htmlFor="birth-date" className="block text-sm font-medium text-gray-400 mb-1">Tanggal Lahir</label>
                                <input
                                    type="text"
                                    id="birth-date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"
                                    placeholder="DD - MM - YYYY"
                                />
                            </div>
                        </div>
                    ) : selectedStyle === 'kidsphotostudio' ? (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-300">Opsi Kids Photo Studio:</h4>
                            <div>
                                <label htmlFor="kids-shirt" className="block text-sm font-medium text-gray-400 mb-1">Baju</label>
                                <input type="text" id="kids-shirt" value={kidsShirt} onChange={(e) => setKidsShirt(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                             <div>
                                <label htmlFor="kids-pants" className="block text-sm font-medium text-gray-400 mb-1">Celana</label>
                                <input type="text" id="kids-pants" value={kidsPants} onChange={(e) => setKidsPants(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                             <div>
                                <label htmlFor="kids-shoes" className="block text-sm font-medium text-gray-400 mb-1">Sepatu</label>
                                <input type="text" id="kids-shoes" value={kidsShoes} onChange={(e) => setKidsShoes(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                             <div>
                                <label htmlFor="kids-accessories" className="block text-sm font-medium text-gray-400 mb-1">Aksesoris</label>
                                <input type="text" id="kids-accessories" value={kidsAccessories} onChange={(e) => setKidsAccessories(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                             <div>
                                <label htmlFor="kids-expression" className="block text-sm font-medium text-gray-400 mb-1">Ekspresi</label>
                                <select id="kids-expression" value={kidsExpression} onChange={(e) => setKidsExpression(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md">
                                    <option value="lucu">Lucu</option>
                                    <option value="menggemaskan">Menggemaskan</option>
                                    <option value="cool">Cool</option>
                                    <option value="natural smile">Natural Smile</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="kids-bg-color" className="block text-sm font-medium text-gray-300 mb-2">
                                    Warna Latar Belakang
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        id="kids-bg-color"
                                        value={kidsBackgroundColor}
                                        onChange={(e) => setKidsBackgroundColor(e.target.value)}
                                        className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                                    />
                                    <span className="font-mono text-gray-400">{kidsBackgroundColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Prompt Akhir:</label>
                                <div className="relative">
                                    <textarea readOnly value={finalKidsStudioPrompt} className="w-full h-48 p-2 text-xs text-gray-400 bg-gray-900/50 rounded-md border-none resize-none font-mono"/>
                                    <button onClick={() => handleCopyToClipboard(finalKidsStudioPrompt)} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200" aria-label="Copy prompt">
                                        {copiedPrompt ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                        {copiedPrompt ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : selectedStyle === 'selfieidol' ? (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-300">Isi Detail Selfie:</h4>
                             <div>
                                <label htmlFor="idol-name" className="block text-sm font-medium text-gray-400 mb-1">Nama Idol</label>
                                <input type="text" id="idol-name" value={selfieIdolName} onChange={(e) => setSelfieIdolName(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                            </div>
                             <div>
                                <label htmlFor="your-pose" className="block text-sm font-medium text-gray-400 mb-1">Pose Anda</label>
                                <input type="text" id="your-pose" value={selfieYourPose} onChange={(e) => setSelfieYourPose(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {poseEmojis.map(emoji => <button key={emoji} onClick={() => handleEmojiClick(emoji, 'you')} className="p-1 text-lg bg-gray-700 rounded-md hover:bg-gray-600">{emoji}</button>)}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="idol-pose" className="block text-sm font-medium text-gray-400 mb-1">Pose Idol</label>
                                <input type="text" id="idol-pose" value={selfieIdolPose} onChange={(e) => setSelfieIdolPose(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {poseEmojis.map(emoji => <button key={emoji} onClick={() => handleEmojiClick(emoji, 'idol')} className="p-1 text-lg bg-gray-700 rounded-md hover:bg-gray-600">{emoji}</button>)}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="idol-bg-color" className="block text-sm font-medium text-gray-400 mb-1">Warna Latar Belakang</label>
                                 <div className="flex items-center gap-3">
                                    <input type="color" id="idol-bg-color" value={selfieIdolBackgroundColor} onChange={(e) => setSelfieIdolBackgroundColor(e.target.value)} className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"/>
                                    <span className="font-mono text-gray-400">{selfieIdolBackgroundColor}</span>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Prompt Akhir:</label>
                                <div className="relative">
                                    <textarea readOnly value={finalSelfieIdolPrompt} className="w-full h-28 p-2 text-xs text-gray-400 bg-gray-900/50 rounded-md border-none resize-none font-mono"/>
                                     <button onClick={() => handleCopyToClipboard(finalSelfieIdolPrompt)} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200" aria-label="Copy prompt">
                                        {copiedPrompt ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                        {copiedPrompt ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    ) : selectedStyle === 'diorama' ? (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-300">Pilih Pencahayaan:</h4>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input id="light-malam" name="lighting-option" type="radio" checked={dioramaLighting === 'malam'} onChange={() => setDioramaLighting('malam')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                    <label htmlFor="light-malam" className="ml-3 block text-sm font-medium text-gray-300">Malam Hari</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="light-siang" name="lighting-option" type="radio" checked={dioramaLighting === 'siang'} onChange={() => setDioramaLighting('siang')} className="h-4 w-4 text-cyan-600 bg-gray-700 border border-gray-600 focus:ring-cyan-500"/>
                                    <label htmlFor="light-siang" className="ml-3 block text-sm font-medium text-gray-300">Siang Hari</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="light-estetik" name="lighting-option" type="radio" checked={dioramaLighting === 'estetik'} onChange={() => setDioramaLighting('estetik')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                    <label htmlFor="light-estetik" className="ml-3 block text-sm font-medium text-gray-300">Pencahayaan Estetik</label>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Prompt Akhir:</label>
                                <div className="relative">
                                    <textarea readOnly value={finalDioramaPrompt} className="w-full h-28 p-2 text-xs text-gray-400 bg-gray-900/50 rounded-md border-none resize-none font-mono"/>
                                    <button onClick={() => handleCopyToClipboard(finalDioramaPrompt)} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200" aria-label="Copy prompt">
                                        {copiedPrompt ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                        {copiedPrompt ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    ) : selectedStyle === 'soccer' ? (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-300">Isi Detail Pemain:</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="club-name" className="block text-sm font-medium text-gray-400 mb-1">Nama Klub</label>
                                    <input type="text" id="club-name" value={clubName} onChange={(e) => setClubName(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                                </div>
                                 <div>
                                    <label htmlFor="club-year" className="block text-sm font-medium text-gray-400 mb-1">Tahun</label>
                                    <input type="text" id="club-year" value={clubYear} onChange={(e) => setClubYear(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                                </div>
                                 <div>
                                    <label htmlFor="jersey-name" className="block text-sm font-medium text-gray-400 mb-1">Nama di Jersey</label>
                                    <input type="text" id="jersey-name" value={jerseyName} onChange={(e) => setJerseyName(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                                </div>
                                 <div>
                                    <label htmlFor="jersey-number" className="block text-sm font-medium text-gray-400 mb-1">Nomor Punggung</label>
                                    <input type="text" id="jersey-number" value={jerseyNumber} onChange={(e) => setJerseyNumber(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="soccer-pose" className="block text-sm font-medium text-gray-400 mb-1">Pilih Pose</label>
                                <select id="soccer-pose" value={selectedSoccerPose} onChange={(e) => setSelectedSoccerPose(e.target.value)} className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md">
                                    {soccerPoses.map((pose, index) => <option key={index} value={pose}>{pose.split(',')[0]}</option>)}
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Prompt Akhir:</label>
                                <div className="relative">
                                    <textarea readOnly value={finalSoccerPrompt} className="w-full h-28 p-2 text-xs text-gray-400 bg-gray-900/50 rounded-md border-none resize-none font-mono"/>
                                     <button onClick={() => handleCopyToClipboard(finalSoccerPrompt)} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200" aria-label="Copy prompt">
                                        {copiedPrompt ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                        {copiedPrompt ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    ) : selectedStyle === 'selfie' ? (
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-gray-300">Pilih Destinasi:</h4>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input id="loc-indonesia" name="location-option" type="radio" checked={selfieLocationOption === 'indonesia'} onChange={() => setSelfieLocationOption('indonesia')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                    <label htmlFor="loc-indonesia" className="ml-3 block text-sm font-medium text-gray-300">Indonesia (Random)</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="loc-world" name="location-option" type="radio" checked={selfieLocationOption === 'world'} onChange={() => setSelfieLocationOption('world')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                    <label htmlFor="loc-world" className="ml-3 block text-sm font-medium text-gray-300">Berbagai belahan dunia (Random)</label>
                                </div>
                                <div className="flex items-center">
                                    <input id="loc-custom" name="location-option" type="radio" checked={selfieLocationOption === 'custom'} onChange={() => setSelfieLocationOption('custom')} className="h-4 w-4 text-cyan-600 bg-gray-700 border-gray-600 focus:ring-cyan-500"/>
                                    <label htmlFor="loc-custom" className="ml-3 block text-sm font-medium text-gray-300">Tuliskan nama negara</label>
                                </div>
                            </div>
                            {selfieLocationOption === 'custom' && (
                                <div className="pl-7">
                                    <input
                                        type="text"
                                        value={customCountry}
                                        onChange={(e) => setCustomCountry(e.target.value)}
                                        placeholder="cth: Japan, France, Brazil"
                                        className="w-full px-3 py-2 text-sm text-gray-200 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                                    />
                                </div>
                            )}
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Prompt Akhir:</label>
                                <div className="relative">
                                    <textarea readOnly value={finalSelfiePrompt} className="w-full h-28 p-2 text-xs text-gray-400 bg-gray-900/50 rounded-md border-none resize-none font-mono"/>
                                     <button onClick={() => handleCopyToClipboard(finalSelfiePrompt)} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200" aria-label="Copy prompt">
                                        {copiedPrompt ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                        {copiedPrompt ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    ) : selectedStyle === 'lamaran' ? (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="bg-color-picker" className="block text-sm font-medium text-gray-300 mb-2">
                                    Pilih Warna Latar Belakang
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        id="bg-color-picker"
                                        value={lamaranBackgroundColor}
                                        onChange={(e) => setLamaranBackgroundColor(e.target.value)}
                                        className="w-10 h-10 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer"
                                    />
                                    <span className="font-mono text-gray-400">{lamaranBackgroundColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Prompt Akhir:</label>
                                <div className="relative">
                                    <textarea readOnly value={finalLamaranPrompt} className="w-full h-48 p-2 text-xs text-gray-400 bg-gray-900/50 rounded-md border-none resize-none font-mono"/>
                                     <button onClick={() => handleCopyToClipboard(finalLamaranPrompt)} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200" aria-label="Copy prompt">
                                        {copiedPrompt ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                        {copiedPrompt ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <p className="text-sm text-gray-400 bg-gray-700/50 p-3 rounded-md whitespace-pre-wrap font-mono min-h-[12rem]">
                                {styleConfig[selectedStyle].prompt}
                            </p>
                            <button onClick={() => handleCopyToClipboard(styleConfig[selectedStyle].prompt)} className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-md transition-colors bg-gray-600 hover:bg-gray-500 text-gray-200" aria-label="Copy prompt">
                                {copiedPrompt ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
                                {copiedPrompt ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                     <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                            <input
                                id="preserve-face-details-kece"
                                name="preserve-face-details-kece"
                                type="checkbox"
                                checked={preserveFaceDetails}
                                onChange={(e) => setPreserveFaceDetails(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-cyan-600 focus:ring-cyan-500"
                            />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                            <label htmlFor="preserve-face-details-kece" className="font-medium text-gray-300">
                                Pertahankan Detail Wajah
                            </label>
                            <p id="preserve-face-details-description-kece" className="text-gray-500">
                                AI akan berusaha menjaga wajah tetap sama seperti foto asli.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => handleGenerate()}
                    disabled={isLoading || (selectedStyle !== 'posecouple' && sourceImages.length === 0)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-gray-900 bg-cyan-400 rounded-lg shadow-lg hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-transform transform hover:scale-105 mt-auto"
                >
                    {isLoading ? <Spinner /> : <GenerateIcon className="w-5 h-5" />}
                    {isLoading ? 'Memproses...' : 'Buat Gambar'}
                </button>
            </div>

            {/* Right Column: Output */}
            <div className="flex flex-col gap-6 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 shadow-2xl min-h-[500px]">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                     <div className="flex flex-col">
                        <h3 className="text-xl font-semibold text-cyan-400 mb-4">Foto Asli</h3>
                        { (selectedStyle !== 'posecouple' && sourceImages.length > 0) || (selectedStyle === 'posecouple' && (manPhoto || womanPhoto)) ? (
                            <div className="bg-gray-900/50 rounded-lg p-2 flex-grow flex items-center justify-center">
                                {selectedStyle === 'posecouple' ? (
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                        <div className="flex flex-col items-center">
                                            {manPhoto ? <img src={manPhoto.preview} alt="Man's face" className="rounded-md w-full object-contain shadow-lg" /> : <div className="h-24 bg-gray-700/50 rounded-md w-full"></div>}
                                            <p className="text-xs text-gray-400 mt-1">Wajah Pria</p>
                                        </div>
                                         <div className="flex flex-col items-center">
                                            {womanPhoto ? <img src={womanPhoto.preview} alt="Woman's face" className="rounded-md w-full object-contain shadow-lg" /> : <div className="h-24 bg-gray-700/50 rounded-md w-full"></div>}
                                            <p className="text-xs text-gray-400 mt-1">Wajah Wanita</p>
                                        </div>
                                    </div>
                                ) : renderUploadPreviews()}
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
                            onRegenerate={() => handleGenerate()}
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
                                    onClick={() => setCurrentImage(histImg)}
                                    role="button"
                                    aria-label={`Lihat riwayat item ${index + 1}`}
                                >
                                    <img 
                                        src={histImg} 
                                        alt={`Riwayat ${index + 1}`}
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

export default PromptKece;