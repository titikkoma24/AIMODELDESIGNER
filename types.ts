
export type BodyShape = 'Sedang' | 'Skinny' | 'Curvy' | 'Athletic' | 'Overweight' | 'Obese' | 'Special Body';
export type BustSize = 'Small' | 'Medium' | 'Large' | 'Extra Large';
export type ButtocksSize = 'Small' | 'Medium' | 'Large' | 'Extra Large';
export type WaistSize = 'Kecil' | 'Sedang' | 'Besar';

// FIX: Added missing FaceAnalysis interface for components/AnalysisDisplay.tsx to resolve import error.
export interface FaceAnalysis {
  faceShape: string;
  hair: string;
  eyes: string;
  nose: string;
  lips: string;
  expression: string;
}

// FIX: Added missing BodyType for components/BodyBuilderPanel.tsx to resolve import error.
export type BodyType = 'Slim' | 'Average' | 'Athletic' | 'Chubby' | 'Obese';

// FIX: Added missing BodyMeasurements for components/BodyBuilderPanel.tsx to resolve import error.
export type BodyMeasurements = 'Small' | 'Medium' | 'Full' | 'Large';

export interface ClothingAnalysis {
  fullOutfit?: string;
  top?: string;
  bottoms?: string;
  footwear?: string;
  accessories?: string;
}
