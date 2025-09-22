import React, { useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onImageUpload: (file: File) => void;
  title: string;
  description: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onImageUpload, title, description, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload, disabled]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className={`${disabled ? 'opacity-50' : ''}`}>
        <h2 className="text-xl font-semibold text-cyan-400 mb-2">{title}</h2>
        <p className="text-gray-400 mb-4">{description}</p>
        <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed border-gray-600 rounded-lg transition-colors duration-300 ${
            disabled 
                ? 'cursor-not-allowed bg-gray-800/50'
                : 'cursor-pointer hover:border-cyan-500 hover:bg-gray-800'
        }`}
        >
        <div className="text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-400">
            <span className={`font-semibold ${disabled ? 'text-gray-500' : 'text-cyan-400'}`}>Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, or WEBP</p>
        </div>
        <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            disabled={disabled}
        />
        </div>
    </div>
  );
};

export default FileUpload;