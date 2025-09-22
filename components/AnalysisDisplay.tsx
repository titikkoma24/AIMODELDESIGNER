
import React from 'react';
import { FaceAnalysis } from '../types';
import Spinner from './Spinner';

interface AnalysisDisplayProps {
  analysis: FaceAnalysis | null;
  isLoading: boolean;
}

const AnalysisItem: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
  <div className="p-3 bg-gray-700/50 rounded-md">
    <p className="text-sm font-medium text-cyan-400">{label}</p>
    <p className="text-gray-300">{value}</p>
  </div>
);

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, isLoading }) => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-cyan-400 mb-4">AI Face Analysis</h3>
      {isLoading ? (
        <div className="flex items-center justify-center h-48 bg-gray-900/50 rounded-lg">
          <Spinner />
          <span className="ml-3 text-gray-400">Analyzing facial features...</span>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <AnalysisItem label="Face Shape" value={analysis.faceShape} />
          <AnalysisItem label="Hair" value={analysis.hair} />
          <AnalysisItem label="Eyes" value={analysis.eyes} />
          <AnalysisItem label="Nose" value={analysis.nose} />
          <AnalysisItem label="Lips" value={analysis.lips} />
          <AnalysisItem label="Expression" value={analysis.expression} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-center text-gray-500 bg-gray-900/50 rounded-lg p-4">
          <p>Analysis details will appear here after you run the analysis.</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
