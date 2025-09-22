// services/geminiService.ts

import { GoogleGenAI, GenerateContentResponse, Type, Modality, Part } from "@google/genai";
import { ClothingAnalysis, BodyShape, BustSize, ButtocksSize, WaistSize } from '../types';

// As per guidelines, initialize with apiKey from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper function to handle image generation/editing responses
const getImageFromResponse = (response: GenerateContentResponse): string => {
    // FIX: Correctly extract image data from the response candidate parts.
    // The model can output both text and image, so we must find the image part.
    for (const candidate of response.candidates ?? []) {
        for (const part of candidate.content.parts) {
            if (part.inlineData?.data) {
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
    useEnhancedPrompt?: boolean
): Promise<string> => {
    const parts: Part[] = [];
    const faceImagePart = getBase64Part(base64FaceData);
    parts.push(faceImagePart);

    let hairPrompt = hairDescription;
    if (hairImageBase64) {
        const hairImagePart = getBase64Part(hairImageBase64);
        parts.push(hairImagePart);
    }
    
    let bodyPrompt;

    if (ageCategory === 'Baby' || ageCategory === 'Child') {
        // Child logic
        bodyPrompt = `The model is a child and MUST be wearing a plain, short-sleeved white t-shirt and plain white long pants made of a soft, comfortable jersey/kaos material. The clothing must be simple, modest, and appropriate for a child.`;
        // Modify for child female with hijab
        if (isHijab && gender === 'female') {
            bodyPrompt = `The model is a child and MUST be wearing a simple, plain white hijab, a plain, long-sleeved white t-shirt, and plain white long pants. The clothing must be simple, modest, and appropriate for a child.`;
        }
    } else {
        // Adult logic
        if (gender === 'male') {
            bodyPrompt = `The model has a ${bodyShape} body shape. For the male model, waist size is ${waistSize}. The model MUST be wearing a plain white t-shirt and white pants made of a soft, comfortable jersey/kaos material.`;
        } else { // female
            const femaleBodyShape = `The model has a ${bodyShape} body shape. For the female model, waist size is ${waistSize}, bust size is ${bustSize}, and buttocks size is ${buttocksSize}.`;
            if (isHijab) {
                bodyPrompt = `${femaleBodyShape} The model MUST be wearing a simple, plain white hijab, a plain, long-sleeved white t-shirt, and plain white pants.`;
            } else {
                bodyPrompt = `${femaleBodyShape} The model MUST be wearing a plain, tight-fitting white t-shirt, white leggings made of a soft, comfortable jersey/kaos material, and white sneakers.`;
            }
        }
    }
    
    const attirePrompt = customAttirePrompt ? `The model's attire is as follows: ${customAttirePrompt}` : bodyPrompt;
    
    const expressionPrompt = expression === "Same as uploaded photo" ? "The model should have the exact same facial expression as in the main uploaded photo." : `The model's facial expression should be: ${expression}.`;

    const enhancedPromptText = `contrasting beautifully with the bright subject. Maintain exact details of both faces and hair from the uploaded reference photos, preserving realistic skin texture, natural expressions, and photorealistic quality.`;

    const finalPrompt = `
        **Primary Goal:** Generate a new, full-body, photorealistic image of a model by compositing a face onto a newly generated body and hair.

        **UNBREAKABLE CORE RULE #1: COMPLETE BODY VISIBILITY.** The generated image MUST be a full-body shot. The model's entire body, from the top of their head to the soles of their feet, MUST be visible within the frame. Cropping of the head, hands, or feet is considered a CATASTROPHIC FAILURE and is strictly forbidden. This is an absolute, non-negotiable requirement.

        **UNBREAKABLE CORE RULE #2: FACE IDENTITY PRESERVATION.** This is the most critical instruction. The face of the generated model MUST be a 100% PERFECT and EXACT replica of the face provided in the first input image. Treat this as a face-swapping task: you are taking the *identity* from the first image and applying it to a new creation. You must NOT alter the facial structure, skin tone, eye shape, nose, lips, or any unique identifying features. The face in the final image must be indistinguishable from the face in the source photo. A similarity of at least ${faceSimilarity}% is required, but you must strive for perfect identity preservation.

        **Hair Generation:**
        - **Instruction:** ${hairPrompt}
        - **Important:** Generate this new hairstyle for the model while STRICTLY adhering to "UNBREAKABLE CORE RULE #2". The new hair should not influence the facial features.

        **Expression:** ${expressionPrompt}
        **Body & Attire:** ${attirePrompt}
        **Age:** The model should appear to be in the '${ageCategory || 'Adult'}' age category.
        **Height:** The model should be approximately ${height} cm tall.
        **Improvements:** ${improveFace ? 'If improvements are applied, they must only affect sharpness, brightness, and minor blemishes. The core facial structure and identity MUST NOT be altered.' : 'No improvements should be applied.'}
        **Background:** The model should be against a plain, neutral light gray studio background. ${useEnhancedPrompt ? enhancedPromptText : ''}
    `;

    parts.push({ text: finalPrompt });
    
    // FIX: Added missing Gemini API call and return statement. The function was not returning a value.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return getImageFromResponse(response);
};

// FIX: Added missing functions that were imported in App.tsx but not exported from this file.

export const improveSharpness = async (base64ImageData: string): Promise<string> => {
    const imagePart = getBase64Part(base64ImageData);
    const prompt = "Improve the sharpness and clarity of this image. Do not change the content or composition.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return getImageFromResponse(response);
};

export const detectAgeCategory = async (base64ImageData: string): Promise<string> => {
    const imagePart = getBase64Part(base64ImageData);
    const prompt = "Analyze the person in this image and determine their age category. Choose from one of the following: Baby, Child, Teenager, Adult, Senior. Return the result in JSON format with a single key 'ageCategory'.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ageCategory: { type: Type.STRING },
                },
                required: ['ageCategory']
            },
        },
    });

    const json = JSON.parse(response.text);
    return json.ageCategory;
};

export const identifyClothing = async (images: { fullDress?: string; top?: string; bottoms?: string; footwear?: string; }): Promise<ClothingAnalysis> => {
    const parts: Part[] = [];
    let prompt = "Analyze the provided image(s) and describe the clothing items. ";

    if (images.fullDress) {
        parts.push(getBase64Part(images.fullDress));
        prompt += "This is a full outfit. Describe it as a whole under the 'fullOutfit' key.";
    } else {
        prompt += "These are separate clothing items. "
        if (images.top) {
            parts.push(getBase64Part(images.top));
            prompt += "Describe the 'top'. ";
        }
        if (images.bottoms) {
            parts.push(getBase64Part(images.bottoms));
            prompt += "Describe the 'bottoms'. ";
        }
        if (images.footwear) {
            parts.push(getBase64Part(images.footwear));
            prompt += "Describe the 'footwear'. ";
        }
    }
    
    prompt += "Return the result as JSON. Only include keys for the items you can identify."
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    fullOutfit: { type: Type.STRING },
                    top: { type: Type.STRING },
                    bottoms: { type: Type.STRING },
                    footwear: { type: Type.STRING },
                },
            },
        },
    });

    return JSON.parse(response.text) as ClothingAnalysis;
};

interface PoseConfig {
    mode: 'image' | 'text';
    poseImageBase64?: string;
    posePrompt?: string;
    objectImagesBase64?: string[];
    poseReferenceType?: 'realistic' | 'sketch';
}
interface ModelInput {
    imageBase64: string;
    gender: 'female' | 'male';
}
interface PoseOptions {
    poseStyle?: 'realistic' | 'sketch';
    aspectRatio?: string;
    isAspectRatioLocked?: boolean;
    lightingStyle?: string;
    shotStyle?: string;
}

export const changePose = async (
    models: ModelInput[],
    poseConfig: PoseConfig,
    options: PoseOptions,
    faceSimilarity: number = 95
): Promise<string> => {
    const parts: Part[] = [];
    let prompt = "Recreate the people from the input images in a new scene. ";
    models.forEach((model, index) => {
        parts.push(getBase64Part(model.imageBase64));
        prompt += `Person ${index + 1} (gender: ${model.gender}) should have their face, identity, and CLOTHING preserved exactly as in their corresponding input image, maintaining at least ${faceSimilarity}% facial similarity. `;
    });

    if (poseConfig.mode === 'image' && poseConfig.poseImageBase64) {
        parts.push(getBase64Part(poseConfig.poseImageBase64));
        if (poseConfig.poseReferenceType === 'sketch') {
            prompt += `
                **CRITICAL POSE INSTRUCTION (FROM SKETCH):** The following image is a sketch provided ONLY as a reference for posing. You MUST map each input person (Person 1, Person 2, etc.) to a figure in the sketch, recreating the pose with photorealism. **DO NOT** include the sketch's art style, lines, or any of the drawn figures in the final output. The final image should be photorealistic and contain ONLY the models from the input photos, but in the new poses from the sketch. The number of people in the final image MUST exactly match the number of input models.
            `;
        } else { // 'realistic'
            prompt += `All people should be posed EXACTLY like the people in the pose reference image, which is a realistic photograph. The number of people and their positions must match. `;
        }
    } else if (poseConfig.mode === 'text' && poseConfig.posePrompt) {
        prompt += `The pose is described as: '${poseConfig.posePrompt}'. The style should be ${options.poseStyle || 'realistic'}. `;
        if (poseConfig.objectImagesBase64 && poseConfig.objectImagesBase64.length > 0) {
            poseConfig.objectImagesBase64.forEach(objBase64 => {
                parts.push(getBase64Part(objBase64));
            });
            prompt += "The models should interact with the provided objects. ";
        }
    }

    if (options.aspectRatio && options.aspectRatio !== 'Original') {
        prompt += `The output image must have an aspect ratio of ${options.aspectRatio}. `;
        if (options.isAspectRatioLocked) {
             prompt += `This aspect ratio is locked and MUST be adhered to. `;
        }
    }
    if (options.lightingStyle) {
        prompt += `The lighting should be '${options.lightingStyle}'. `;
    }
    if (options.shotStyle) {
        prompt += `The camera shot style should be '${options.shotStyle}'. `;
    }

    prompt += " The background should be a neutral gray studio background.";
    
    // Add the user-requested enhancement to the final prompt.
    const enhancedPromptText = " (do not change the face from the attached reference photo) very contrast with the bright subject. Maintain the exact facial and hair details of the uploaded reference photo, maintain realistic skin texture, natural expressions, and photorealistic quality.";
    prompt += enhancedPromptText;
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return getImageFromResponse(response);
};

export const changeBackground = async (
    base64Image: string,
    backgroundPrompt: string,
    shotStyle: string,
    lightStyle: string
): Promise<string> => {
    const imagePart = getBase64Part(base64Image);
    const prompt = `
        Change the background of this image. The new background should be: '${backgroundPrompt}'.
        Preserve the foreground subject(s) EXACTLY as they are. Do not change their pose, clothing, or appearance.
        The camera shot style should be '${shotStyle}'.
        The lighting style should be '${lightStyle}'.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return getImageFromResponse(response);
};

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Translate the following text to ${targetLanguage}. Provide only the translated text, with no extra explanations or preamble: "${text}"`,
    });
    return response.text;
};

export const analyzePose = async (base64Image: string): Promise<string> => {
    const imagePart = getBase64Part(base64Image);
    const prompt = "Analyze the pose of the person in this image. Provide a detailed, descriptive text that could be used as an AI prompt to recreate this exact pose. Describe body part positions, angles, and the overall posture and emotion conveyed.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text;
};

export const improvePrompt = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a prompt engineering expert for generative AI. Your task is to take a user's prompt and make it more vivid, detailed, and effective for generating high-quality images. Improve the following prompt: "${prompt}"`,
    });
    return response.text;
};

export const analyzeImageForPrompt = async (base64Image: string): Promise<string> => {
    const imagePart = getBase64Part(base64Image);
    const prompt = "You are an expert art director. Describe this image in extreme detail. Your description will be used as a text prompt for an AI image generator. Cover subject, composition, lighting, style, color palette, and any fine details. Be verbose and evocative.";
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
    });
    return response.text;
};

export const summarizePrompt = async (detailedPrompt: string, detailLevel: 'Concise' | 'Detailed' | 'Artistic'): Promise<string> => {
    let systemInstruction = "";
    switch(detailLevel) {
        case 'Concise':
            systemInstruction = "You are a prompt summarizer. Your task is to take a very long, detailed description and condense it into a short, effective prompt for an AI image generator, focusing only on the most critical elements.";
            break;
        case 'Detailed':
            systemInstruction = "You are a prompt editor. Your task is to refine a long, detailed description into a well-structured and effective prompt for an AI image generator, keeping a high level of detail but improving clarity and flow.";
            break;
        case 'Artistic':
            systemInstruction = "You are a creative writer for AI prompts. Your task is to take a long, detailed description and transform it into an artistic and evocative prompt, using creative language to capture the mood and style while retaining key details.";
            break;
    }
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on your role, process the following text: "${detailedPrompt}"`,
        config: {
            systemInstruction: systemInstruction,
        }
    });
    return response.text;
};

export const editWithNanoBanana = async (
    base64Images: string[],
    prompt: string,
    shotStyle: string,
    lightStyle: string,
    aspectRatio: string
): Promise<string> => {
    const imageParts: Part[] = base64Images.map(img => getBase64Part(img));
    const enhancedPromptText = " (do not change the face from the attached reference photo) very contrast with the bright subject. Maintain the exact facial and hair details of the uploaded reference photo, maintain realistic skin texture, natural expressions, and photorealistic quality.";
    const finalPrompt = `
        **Primary Goal:** Edit the provided image(s) based on the user's request. If multiple images are provided, treat the first as the primary subject and the others as context or elements to incorporate.

        **UNBREAKABLE CORE RULE #1: PRESERVE FACE AND IDENTITY.** The face and identity of any person in the primary image MUST be preserved with 100% accuracy. Do not alter their facial features, structure, or skin tone in any way. This is a non-negotiable directive.

        **User's Edit Request:** ${prompt}

        **Stylistic Direction:**
        - **Shot Style:** The final image should have a '${shotStyle}' composition.
        - **Lighting Style:** The lighting should be '${lightStyle}'.
        - **Aspect Ratio:** The final image aspect ratio MUST be ${aspectRatio}. Adhere to this strictly if it's not 'Original'.

        Apply the user's edit request while adhering to all stylistic directions and the unbreakable core rule.${enhancedPromptText}
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [...imageParts, { text: finalPrompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return getImageFromResponse(response);
};

export const changeHairStyle = async (
    base64FaceData: string,
    hairStylePrompt: string,
    gender: 'wanita' | 'pria'
): Promise<string> => {
    const faceImagePart = getBase64Part(base64FaceData);

    const enhancedPromptText = 'contrasting beautifully with the bright subject. Maintain exact details of both faces and hair from the uploaded reference photos, preserving realistic skin texture, natural expressions, and photorealistic quality';

    const finalPrompt = `
        **Primary Goal:** Generate a new, photorealistic, full-body image of a model, focusing exclusively on changing the hairstyle while preserving all other features.

        **UNBREAKABLE CORE RULE #1: PERFECT FACE IDENTITY PRESERVATION.** This is the most critical instruction. The face of the generated model MUST be a 100% PERFECT and EXACT replica of the face provided in the input image. You must NOT alter the facial structure, skin tone, eye shape, nose, lips, or any unique identifying features. The face in the final image must be indistinguishable from the face in the source photo. A similarity of at least 98% is required.

        **UNBREAKABLE CORE RULE #2: PRESERVE BODY AND ATTIRE.** The model's body shape, clothing, and pose from the original photo MUST be preserved exactly. Do NOT change the outfit or the way the person is standing or sitting.

        **HAIR INSTRUCTION (The ONLY change allowed):**
        - The model is a ${gender === 'wanita' ? 'female' : 'male'}.
        - Replace the current hairstyle with the following: "${hairStylePrompt}".
        - The new hair should look natural and fit the person's head and face shape perfectly.

        **Background:** The model should be against a plain, neutral light gray studio background. ${enhancedPromptText}

        **Final Output:** A full-body shot showing the original person with only their hairstyle changed as per the instruction.
    `;

    const parts: Part[] = [faceImagePart, { text: finalPrompt }];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    return getImageFromResponse(response);
};