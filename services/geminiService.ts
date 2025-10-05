// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse, Type, Modality, Part } from "@google/genai";
import { ClothingAnalysis, BodyShape, BustSize, ButtocksSize, WaistSize } from '../types';

export const getFriendlyErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        const message = error.message;

        // Check for specific quota error
        if (message.includes('429') && (message.includes('quota') || message.includes('RESOURCE_EXHAUSTED'))) {
            let retryAfter = '';
            // Extract retry delay, e.g., "Please retry in 52.652050002s." or "retryDelay":"52s"
            const retryMatchSeconds = message.match(/Please retry in ([\d.]+)s/);
            const retryMatchJson = message.match(/"retryDelay":"(\d+)s"/);

            let seconds = 0;
            if (retryMatchSeconds && retryMatchSeconds[1]) {
                seconds = Math.ceil(parseFloat(retryMatchSeconds[1]));
            } else if (retryMatchJson && retryMatchJson[1]) {
                seconds = parseInt(retryMatchJson[1], 10);
            }
            
            if (seconds > 0) {
                const minutes = Math.ceil(seconds / 60);
                retryAfter = ` Please wait about ${minutes} minute${minutes > 1 ? 's' : ''} and try again.`;
            }
            return `API Request Limit Reached. You have exceeded the free tier quota.${retryAfter} To continue, please check your plan and billing details on the Google AI platform.`;
        }

        // Check for other common errors like API key issues
        if (message.toLowerCase().includes('api key not valid')) {
             return 'API Key Not Valid. Please ensure your API key is correctly configured in your environment variables.';
        }
        
        // Try to parse for a more generic Gemini API error message
        try {
            const parsed = JSON.parse(message);
            if (parsed.error && parsed.error.message) {
                // Shorten the message if it's too long
                const mainMessage = parsed.error.message.split('\n')[0];
                return `An API error occurred: ${mainMessage}`;
            }
        } catch (e) {
            // Not a JSON string, fall through
        }

        // Return the original message as a fallback
        return error.message;
    }
    return 'An unknown error occurred.';
};


// As per guidelines, initialize with apiKey from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to handle image generation/editing responses
const getImageFromResponse = (response: GenerateContentResponse): string => {
    // FIX: Correctly extract image data from the response candidate parts.
    // The model can output both text and image, so we must find the image part.
    for (const candidate of response.candidates ?? []) {
        // FIX: Corrected typo `the part` to `const part` and added check for image mimeType.
        for (const part of candidate.content.parts) {
            if (part.inlineData?.data && part.inlineData.mimeType?.startsWith('image/')) {
                return part.inlineData.data;
            }
        }
    }
    throw new Error("No image data found in the response from Gemini API.");
};


const getBase64Part = (base64Data: string, mimeType: string = 'image/jpeg'): Part => {
    return {
        inlineData: {
            data: base64Data,
            mimeType,
        }
    };
};

// --- Function Implementations ---

// FIX: Completed the function implementation to ensure it always constructs a prompt, makes an API call, and returns a value.
export const generateModel = async (
    base64FaceData: string,
    hairDescription: string,
    improveFace: boolean,
    expression: string,
    ageCategory: string | null,
    gender: 'female' | 'male',
    hairImageBase64: string | null,
    bodyShape: BodyShape,
    bustSize: BustSize,
    buttocksSize: ButtocksSize,
    waistSize: WaistSize,
    height: number,
    customAttirePrompt?: string,
    isHijab?: boolean,
    faceSimilarity: number = 95,
    useEnhancedPrompt?: boolean,
    isCloseUp?: boolean
): Promise<string> => {
    const parts: Part[] = [];
    const faceImagePart = getBase64Part(base64FaceData);
    parts.push(faceImagePart);

    let hairPrompt = hairDescription;
    if (hairImageBase64) {
        const hairImagePart = getBase64Part(hairImageBase64);
        parts.push(hairImagePart);
    }
    
    const expressionPrompt = expression === "Same as uploaded photo" ? "The model should have the exact same facial expression as in the main uploaded photo." : `The model's facial expression should be: ${expression}.`;
    
    let finalPrompt = '';

    const tuneUpPrompt = 'Apply the following facial tune-ups: remove acne, make the skin look brighter, remove skin blemishes, apply sharp detail to the eyes, hair, and eyebrows, and ensure the detail of skin pores is visible and realistic. The core facial structure and identity MUST NOT be altered.';

    if (isCloseUp) {
        let hairAndAttireSection = '';

        if (isHijab && gender === 'female') {
            hairAndAttireSection = `
            **UNBREAKABLE CORE RULE #2: FRAMING & ATTIRE.**
            - **Framing:** The image MUST be a postcard-style half-body portrait, framed from the stomach up to the top of the head.
            - **Aspect Ratio:** The final output MUST be a 3:4 portrait aspect ratio.
            - **Attire:** The model MUST be wearing a simple, plain, solid white hijab. The hijab must cover the hair completely. The top visible under the hijab should also be a simple, plain white fabric that complements the hijab.

            **Hair Generation:**
            - **Instruction:** This is superseded by the hijab requirement. No hair should be visible.
            `;
        } else {
            hairAndAttireSection = `
            **UNBREAKABLE CORE RULE #2: FRAMING & ATTIRE.**
            - **Framing:** The image MUST be a postcard-style half-body portrait, framed from the stomach up to the top of the head.
            - **Aspect Ratio:** The final output MUST be a 3:4 portrait aspect ratio.
            - **Attire:** The model MUST be wearing a simple, plain, crew-neck white t-shirt. This applies to all genders and ages.

            **Hair Generation:**
            - **Instruction:** ${hairPrompt}
            - **Important:** Generate this new hairstyle for the model while STRICTLY adhering to "UNBREAKABLE CORE RULE #1". The new hair should not influence the facial features.
            `;
        }
        
        const enhancedPrompt = `
            **ABSOLUTE DIRECTIVE: PROFESSIONAL POSTCARD QUALITY & IDENTITY LOCK**
            This is a non-negotiable directive that overrides all other stylistic considerations.
            - **IDENTITY LOCK (100%):** You are explicitly and absolutely forbidden from altering the subject's facial details in any way. The face from the uploaded photo must be preserved with 100% accuracy, maintaining every unique feature, proportion, and nuance. Any deviation, no matter how small, is a failure.
            - **CAMERA & LENS SIMULATION:** The final image must look as if it were captured with a professional DSLR camera using a high-end prime lens.
            - **HYPER-REALISM & DETAIL (CRITICAL):** The quality must be exceptionally high-resolution. The sharpness and clarity must be paramount. You MUST render hyper-realistic skin texture, making individual skin pores clearly visible and detailed. Achieve crystal-clear, macro-level detail on the face, eyes, and hair without creating an artificial look.
            - **Lighting:** Use soft, beautiful, and extremely natural lighting, as if from a large window on an overcast day. This should flatter the subject while highlighting the realistic skin texture.
            - **Background:** The background must be a solid, soft, light blue color.
            - **Composition:** The model should be centered, with a natural, engaging pose suitable for a postcard portrait.
        `;

        const defaultQualityPrompt = `
            **Quality & Style:**
            - **SKIN TEXTURE (CRITICAL):** The final image must be exceptionally detailed, with a strong focus on rendering realistic and natural skin texture. Maximize the detail to the point where skin pores are visible and clear.
            - **Lighting:** The lighting must be soft and natural, creating a gentle and flattering look. The light source should be primarily from the front, illuminating the subject clearly.
            - **Background:** The background must be a solid, soft, light blue color.
            - **Sharpness:** The image should be very sharp and clear, as if taken by a professional camera.
        `;
        
        finalPrompt = `
            **Primary Goal:** Generate an extraordinary, photorealistic, postcard-style half-body portrait of a model.

            **UNBREAKABLE CORE RULE #1: PERFECT FACE IDENTITY PRESERVATION.**
            This is the most critical instruction. The face of the generated model MUST be a 100% PERFECT and EXACT replica of the face provided in the first input image. Treat this as a face-swapping task: you are taking the *identity* from the first image and applying it to a new creation. You must NOT alter the facial structure, skin tone, eye shape, nose, lips, or any unique identifying features. A similarity of ${faceSimilarity}% is MANDATORY. You MUST achieve perfect 100% identity preservation without any alterations.

            ${hairAndAttireSection}

            **Body Shape Impression:**
            - The model's visible torso (stomach to shoulders) should subtly reflect a '${bodyShape}' body shape. For example, an 'Athletic' shape might have a more defined core and broader shoulders, while a 'Curvy' shape would show a more defined waist-to-hip ratio. This is a subtle but important detail to convey the overall physique within the half-body frame.

            **Expression:** ${expressionPrompt}
            **Age:** The model should appear to be in the '${ageCategory || 'Adult'}' age category.
            
            ${useEnhancedPrompt ? enhancedPrompt : defaultQualityPrompt}
            
            **Improvements:** ${improveFace ? tuneUpPrompt : 'No improvements should be applied.'}
        `;
    } else {
        let bodyPrompt;
        const defaultQualityPrompt = `
            **Quality & Style:**
            - **SKIN TEXTURE (CRITICAL):** The final image must be exceptionally detailed, with a strong focus on rendering realistic and natural skin texture. Maximize the detail to the point where skin pores are visible and clear.
            - **Lighting:** The lighting must be soft and natural, creating a gentle and flattering look. The light source should be primarily from the front, illuminating the subject clearly.
            - **Background:** The background must be a solid, soft, light blue color.
            - **Sharpness:** The image should be very sharp and clear, as if taken by a professional camera.
        `;

        const enhancedPrompt = `
            **ABSOLUTE DIRECTIVE: PROFESSIONAL QUALITY & IDENTITY LOCK**
            - **IDENTITY LOCK (100%):** You are explicitly and absolutely forbidden from altering the subject's facial details in any way. The face from the uploaded photo must be preserved with 100% accuracy.
            - **CAMERA & LENS SIMULATION:** The final image must look as if it were captured with a professional DSLR camera using a high-end prime lens.
            - **HYPER-REALISM & DETAIL (CRITICAL):** The quality must be exceptionally high-resolution. Render hyper-realistic skin texture, making individual skin pores clearly visible.
            - **Lighting:** Use soft, natural lighting.
            - **Background:** The background must be a solid, soft, light blue color.
        `;

        if (ageCategory === 'Baby' || ageCategory === 'Child') {
            bodyPrompt = `The model is a ${ageCategory}. The body should be age-appropriate and natural. The model is wearing a simple white t-shirt and white pants.`;
        } else {
            let attirePrompt;
            if (customAttirePrompt) {
                attirePrompt = customAttirePrompt;
            } else if (isHijab) {
                attirePrompt = 'The model MUST be wearing a simple, plain, solid white hijab, a matching white t-shirt, and plain white long pants.';
            } else if (gender === 'female') {
                attirePrompt = 'The model MUST be wearing a tight white crop top t-shirt, tight white leggings, and white sneakers.';
            } else { // male, no hijab
                attirePrompt = 'The model MUST be wearing a white oversized t-shirt, black ankle-length fabric trousers, and white sneakers.';
            }

             bodyPrompt = `
                **UNBREAKABLE CORE RULE #2: BODY, POSE & ATTIRE.**
                - **Framing:** The image MUST be a full-body portrait, showing the entire body from head to toe.
                - **Pose:** The model must be in a random, improved, natural standing pose. The pose should look dynamic and engaging, suitable for a model photoshoot.
                - **Aspect Ratio:** The final output MUST be a 3:4 portrait aspect ratio.
                - **Attire:** ${attirePrompt}
                
                **Body Generation:**
                - **Height:** The model's height should be approximately ${height} cm.
                - **Body Shape:** The model's physique should represent a '${bodyShape}' body shape.
                - **Bust Size (if applicable):** ${gender === 'female' ? bustSize : 'N/A'}.
                - **Buttocks Size (if applicable):** ${gender === 'female' ? buttocksSize : 'N/A'}.
                - **Waist Size:** ${waistSize}.
            `;
        }

        finalPrompt = `
            **Primary Goal:** Generate an extraordinary, photorealistic, full-body portrait of a model.

            **UNBREAKABLE CORE RULE #1: PERFECT FACE IDENTITY PRESERVATION.**
            This is the most critical instruction. The face of the generated model MUST be a 100% PERFECT and EXACT replica of the face provided in the first input image. Treat this as a face-swapping task: you are taking the *identity* from the first image and applying it to a new creation. You must NOT alter the facial structure, skin tone, eye shape, nose, lips, or any unique identifying features. A similarity of ${faceSimilarity}% is MANDATORY.

            ${bodyPrompt}

            **Hair Generation:**
            - **Instruction:** ${hairPrompt}
            - **Important:** Generate this new hairstyle for the model while STRICTLY adhering to "UNBREAKABLE CORE RULE #1".

            **Expression:** ${expressionPrompt}
            **Age:** The model should appear to be in the '${ageCategory || 'Adult'}' age category.

            ${useEnhancedPrompt ? enhancedPrompt : defaultQualityPrompt}

            **Improvements:** ${improveFace ? tuneUpPrompt : 'No improvements should be applied.'}
        `;
    }

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            seed: 42,
        },
    });

    return getImageFromResponse(response);
};

export const improveSharpness = async (base64ImageData: string): Promise<string> => {
    const imagePart = getBase64Part(base64ImageData);
    const promptPart = {
        text: "Improve the sharpness and clarity of this image. Enhance the details, especially on the face, eyes, and hair. Make the skin texture more realistic and visible. Do not change the composition or the person's identity.",
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, promptPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            seed: 42,
        },
    });

    return getImageFromResponse(response);
};

export const identifyClothing = async (images: {
  fullDress?: string;
  top?: string;
  bottoms?: string;
  footwear?: string;
}): Promise<ClothingAnalysis> => {
    const parts: Part[] = [];
    let promptText = "Analyze the clothing item(s) in the following image(s) and provide a detailed description for each category. If a 'fullDress' image is provided, analyze it as a complete outfit. Otherwise, analyze the individual items. Also describe any visible accessories.";

    if (images.fullDress) {
        parts.push(getBase64Part(images.fullDress));
        promptText += " Focus on the full outfit.";
    } else {
        if (images.top) parts.push(getBase64Part(images.top));
        if (images.bottoms) parts.push(getBase64Part(images.bottoms));
        if (images.footwear) parts.push(getBase64Part(images.footwear));
    }

    parts.push({ text: promptText });
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            fullOutfit: { type: Type.STRING, description: 'A description of the complete outfit if a single photo is provided.' },
            top: { type: Type.STRING, description: 'A description of the top clothing item.' },
            bottoms: { type: Type.STRING, description: 'A description of the bottom clothing item.' },
            footwear: { type: Type.STRING, description: 'A description of the footwear.' },
            accessories: { type: Type.STRING, description: 'A description of any accessories.' },
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: 'application/json',
            responseSchema,
            seed: 42,
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as ClothingAnalysis;
};

export const detectAgeCategory = async (base64FaceData: string): Promise<string> => {
    const imagePart = getBase64Part(base64FaceData);
    const promptPart = { text: "Analyze the person in the image and determine their age category from the following options: 'Baby', 'Child', 'Adult'. Respond with only one of these words." };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, promptPart] },
        config: {
            seed: 42,
        },
    });
    
    const text = response.text.trim();
    if (['Baby', 'Child', 'Adult'].includes(text)) {
        return text;
    }
    return 'Adult';
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const prompt = `Translate the following text to ${targetLanguage}: "${text}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            seed: 42,
        },
    });
    return response.text.trim();
};

export const changePose = async (
    modelInputs: { imageBase64: string; gender: 'female' | 'male' }[],
    poseConfig: { mode: 'image'; poseImageBase64: string; poseReferenceType: 'realistic' | 'sketch' } | { mode: 'text'; posePrompt: string; objectImagesBase64: string[] },
    outputConfig: { aspectRatio?: string; isAspectRatioLocked?: boolean; lightingStyle?: string; shotStyle?: string },
    faceSimilarity: number
): Promise<string> => {
    const parts: Part[] = [];
    modelInputs.forEach(input => {
        parts.push(getBase64Part(input.imageBase64));
    });

    let prompt = '';
    if (poseConfig.mode === 'image') {
        parts.push(getBase64Part(poseConfig.poseImageBase64));
        prompt = `Recreate the pose from the last provided image (${poseConfig.poseReferenceType} reference) using the people from the first ${modelInputs.length} image(s).`;
    } else { // text mode
        poseConfig.objectImagesBase64.forEach(objBase64 => {
            parts.push(getBase64Part(objBase64));
        });
        prompt = poseConfig.posePrompt;
    }
    
    prompt += ` Preserve the faces and identities of the people with ${faceSimilarity}% similarity.`;

    if (outputConfig.shotStyle && outputConfig.shotStyle !== 'Original') {
        prompt += ` The final image should have a '${outputConfig.shotStyle}' style.`;
    }
    if (outputConfig.lightingStyle && outputConfig.lightingStyle !== 'Original') {
        prompt += ` The lighting should be '${outputConfig.lightingStyle}'.`;
    }
    if (outputConfig.aspectRatio && outputConfig.aspectRatio !== 'Original') {
        prompt += ` The final image aspect ratio must be ${outputConfig.aspectRatio}.`;
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            seed: 42,
        },
    });

    return getImageFromResponse(response);
};

export const changeBackground = async (
    base64Images: string[],
    prompt: string,
    shotStyle: string,
    lightStyle: string,
    aspectRatio: string,
    isAspectRatioLocked: boolean
): Promise<string> => {
    const parts: Part[] = base64Images.map(img => getBase64Part(img));
    
    let finalPrompt = prompt;

    if (!finalPrompt.includes("shot style")) {
      finalPrompt += ` The shot style should be '${shotStyle}'.`;
    }
    if (!finalPrompt.includes("lighting")) {
        finalPrompt += ` The lighting should be '${lightStyle}'.`;
    }
    if (aspectRatio !== 'Original' && isAspectRatioLocked && !finalPrompt.includes("aspect ratio")) {
        finalPrompt += ` The final image must have an aspect ratio of ${aspectRatio}.`;
    }
    
    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            seed: 42,
        },
    });

    return getImageFromResponse(response);
};

export const analyzePose = async (base64ImageData: string): Promise<string> => {
    const imagePart = getBase64Part(base64ImageData);
    const promptPart = { text: "Analyze the person's pose in this image, focusing strictly on the physical posture. Describe the shape of the pose, body proportions, and facial/body expression. Ignore clothing, hair color, and background details. Keep the analysis concise and suitable for an AI image generator." };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, promptPart] },
        config: {
            seed: 42,
        },
    });

    return response.text.trim();
};

export const analyzePoseAndClothing = async (poseImageBase64: string, clothingImageBase64: string): Promise<string> => {
    const poseImagePart = getBase64Part(poseImageBase64);
    const clothingImagePart = getBase64Part(clothingImageBase64);
    
    const promptPart = {
        text: `You are an expert prompt engineer for an AI image generator. Your task is to combine information from two images into a single, cohesive prompt.
1. From the first image (the pose reference), provide a detailed, anatomical description of the person's pose. Focus strictly on the physical posture, body shape, and expression. Completely ignore the clothing, hair, and background in this first image.
2. From the second image (the clothing reference), provide a detailed description of the full outfit shown, including top, bottoms, footwear, and any accessories.
3. Combine these two descriptions into a single, clear prompt that instructs an AI to generate a photorealistic image of a person in the specified pose wearing the specified clothing. The final output should ONLY be the combined prompt text.`
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [poseImagePart, clothingImagePart, promptPart] },
        config: {
            seed: 42,
        },
    });

    return response.text.trim();
};

export const improvePrompt = async (prompt: string): Promise<string> => {
    const systemInstruction = "You are a prompt engineering expert for AI image generation models. Your task is to take a user's simple prompt and enhance it into a more descriptive, detailed, and evocative prompt that will produce a higher quality, more artistic image. Add details about composition, lighting, style, and camera settings.";
    const userPrompt = `Improve this prompt: "${prompt}"`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            seed: 42,
        }
    });

    return response.text.trim();
};

export const editWithNanoBanana = async (
    base64Images: string[],
    prompt: string,
    shotStyle: string,
    lightStyle: string,
    aspectRatio: string,
    preserveFaceDetails: boolean,
    maskBase64: string | null,
    hasMaskedReference: boolean
): Promise<string> => {
    const parts: Part[] = base64Images.map((img, index) => {
        if (index === 1 && hasMaskedReference) {
            return getBase64Part(img, 'image/jpeg');
        }
        return getBase64Part(img);
    });

    if (maskBase64) {
        parts.push({
            inlineData: {
                data: maskBase64,
                mimeType: 'image/png'
            }
        });
    }

    let finalPrompt = prompt;
    if (preserveFaceDetails) {
        finalPrompt += " CRITICAL INSTRUCTION: Preserve the facial details and identity of the person in the first image with 100% accuracy.";
    }
    if (shotStyle !== 'Original') {
        finalPrompt += ` The shot style should be '${shotStyle}'.`;
    }
    if (lightStyle !== 'Original') {
        finalPrompt += ` The lighting should be '${lightStyle}'.`;
    }
    if (aspectRatio !== 'Original') {
        finalPrompt += ` The aspect ratio of the final image must be ${aspectRatio}.`;
    }
    if (hasMaskedReference) {
        finalPrompt += " Place the content of the second image into the masked area of the first image."
    }

    parts.push({ text: finalPrompt });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            seed: 42,
        },
    });

    return getImageFromResponse(response);
};

export const generateImageFromText = async (
    prompt: string,
    aspectRatio: string,
    shotStyle: string,
    lightStyle: string,
    imageStyle?: string
): Promise<string> => {
    
    let finalPrompt = prompt;
    if (shotStyle !== 'Original') {
        finalPrompt += `, ${shotStyle}`;
    }
    if (lightStyle !== 'Original') {
        finalPrompt += `, ${lightStyle} lighting`;
    }
    if (imageStyle) {
        finalPrompt += `, in a ${imageStyle} style`;
    }

    const ratioValue = aspectRatio.split(' ')[0];
    const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    let finalAspectRatio = '1:1'; // Default value
    if (validRatios.includes(ratioValue)) {
        finalAspectRatio = ratioValue;
    }

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: finalAspectRatio,
            seed: 42,
        },
    });

    return response.generatedImages[0].image.imageBytes;
};

export const changeHairStyle = async (
    base64FaceData: string,
    hairStylePrompt: string,
    gender: 'wanita' | 'pria',
    hairReferenceBase64: string | null
): Promise<string> => {
    const parts: Part[] = [getBase64Part(base64FaceData)];
    if (hairReferenceBase64) {
        parts.push(getBase64Part(hairReferenceBase64));
    }

    const prompt = `Change the hairstyle of the person in the first image. The subject is a ${gender === 'wanita' ? 'female' : 'male'}. New hairstyle description: ${hairStylePrompt}. IMPORTANT: Do NOT change the person's face, expression, clothing, or the background. Only change the hair. The facial identity must be preserved with 100% accuracy.`;
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            seed: 42,
        },
    });

    return getImageFromResponse(response);
};

export const analyzeHairStyle = async (base64HairData: string): Promise<string> => {
    const imagePart = getBase64Part(base64HairData);
    const promptPart = { text: "Provide a detailed description of the hairstyle in this image. Describe the color, length, texture (e.g., straight, wavy, curly), and style (e.g., bob, ponytail, layers). The description should be suitable for an AI image generator." };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, promptPart] },
        config: {
            seed: 42,
        },
    });

    return response.text.trim();
};

export const touchUpFace = async (base64FaceData: string, touchUpPrompt: string): Promise<string> => {
    const imagePart = getBase64Part(base64FaceData);
    const prompt = `Apply a facial touch-up to the person in the image based on these instructions: ${touchUpPrompt}. IMPORTANT: Only modify the skin and apply makeup as described. Do not change the person's facial structure, hair, clothing, or the background. The core identity must be preserved perfectly.`;
    const promptPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, promptPart] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
            seed: 42,
        },
    });

    return getImageFromResponse(response);
};

export interface VideoPromptResult {
  prompt: string;
  explanation: string;
}

export const generateVideoPrompts = async (userPrompt: string): Promise<{ meta: VideoPromptResult; veo: VideoPromptResult; sora: VideoPromptResult; }> => {
  const systemInstruction = `You are a world-class prompt engineer specializing in text-to-video AI models. Your task is to take a user's simple idea and expand it into three distinct, highly detailed, and effective prompts, one for each of the following platforms: Meta AI's video generator, Google Veo, and OpenAI's Sora (via ChatGPT).

For each platform, you must:
1.  Create a 'prompt' that is long, descriptive, and tailored to the known strengths and syntax of that specific model. Include details about shot type, camera movement, lighting, composition, subject actions, atmosphere, and desired style.
2.  Provide a concise 'explanation' of why the prompt is structured that way for that specific model, highlighting the key phrases or concepts that work well on that platform.

Return the result as a JSON object.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      meta: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING, description: "The detailed prompt for Meta AI's video generator." },
          explanation: { type: Type.STRING, description: "Explanation of the Meta AI prompt." },
        },
        required: ['prompt', 'explanation'],
      },
      veo: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING, description: "The detailed prompt for Google Veo." },
          explanation: { type: Type.STRING, description: "Explanation of the Google Veo prompt." },
        },
         required: ['prompt', 'explanation'],
      },
      sora: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING, description: "The detailed prompt for OpenAI's Sora." },
          explanation: { type: Type.STRING, description: "Explanation of the Sora prompt." },
        },
        required: ['prompt', 'explanation'],
      },
    },
    required: ['meta', 'veo', 'sora'],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Expand this video idea: "${userPrompt}"`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
      seed: 42,
    },
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const analyzeImageForPrompt = async (base64ImageData: string): Promise<string> => {
    const imagePart = getBase64Part(base64ImageData);
    const promptPart = { 
        text: "You are an expert prompt analyzer. Look at this image and generate a concise but detailed prompt that could be used to recreate it with an AI image generator. Focus on the subject, style, lighting, and composition. The prompt should not be overly long but must be effective." 
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, promptPart] },
        config: {
            seed: 42,
        },
    });

    return response.text.trim();
};

export interface PromptModifications {
    gender?: 'pria' | 'wanita';
    objectCount?: string;
    shirt?: string;
    pants?: string;
    shoes?: string;
    accessories?: string;
    lockFace?: boolean;
    hairDescription?: string;
    isHijab?: boolean;
}

export const refinePromptWithModifications = async (
    originalPrompt: string,
    modifications: PromptModifications
): Promise<string> => {
    let modificationInstructions = "Apply the following changes:\n";
    if (modifications.gender) {
        modificationInstructions += `- Change the main subject's gender to ${modifications.gender === 'pria' ? 'male' : 'female'}.\n`;
    }
    if (modifications.objectCount) {
        modificationInstructions += `- Ensure the scene contains: ${modifications.objectCount}.\n`;
    }
    if (modifications.shirt) {
        modificationInstructions += `- The subject should wear: ${modifications.shirt}.\n`;
    }
    if (modifications.pants) {
        modificationInstructions += `- The subject's pants should be: ${modifications.pants}.\n`;
    }
    if (modifications.shoes) {
        modificationInstructions += `- The subject's shoes should be: ${modifications.shoes}.\n`;
    }
    if (modifications.accessories) {
        modificationInstructions += `- Include these accessories: ${modifications.accessories}.\n`;
    }
    if (modifications.isHijab) {
        modificationInstructions += `- The subject MUST be wearing a simple, plain hijab. Any existing hair or headwear must be replaced by the hijab.\n`;
    } else if (modifications.hairDescription) {
        modificationInstructions += `- Change the subject's hair to: ${modifications.hairDescription}.\n`;
    }
    if (modifications.lockFace) {
        modificationInstructions += `- CRITICAL: Jangan rubah detail wajah sedikitpun, Pertahankan kemiripan wajah dan ekspresi 100%.\n`;
    }

    const systemInstruction = `You are a prompt engineering expert. Your task is to intelligently integrate user-specified modifications into a base prompt. Rewrite the base prompt to naturally include all the changes. Do not just list the changes. Create a new, cohesive, and effective prompt. Respond with ONLY the final, updated prompt text.`;
    
    const userPrompt = `Base Prompt: "${originalPrompt}"\n\nModifications:\n${modificationInstructions}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            seed: 42,
        }
    });

    return response.text.trim();
};