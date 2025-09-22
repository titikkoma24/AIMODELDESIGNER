import React, { useState, useRef, MouseEvent } from 'react';

interface ImageZoomProps {
  src: string;
  alt: string;
  zoomLevel?: number;
  loupeSize?: number;
}

const ImageZoom: React.FC<ImageZoomProps> = ({
  src,
  alt,
  zoomLevel = 2.5,
  loupeSize = 150,
}) => {
  const [showZoom, setShowZoom] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current || !containerRef.current) return;

    const { left: containerLeft, top: containerTop } = containerRef.current.getBoundingClientRect();
    const { left: imgLeft, top: imgTop, width: imgWidth, height: imgHeight } = imgRef.current.getBoundingClientRect();
    
    // Position of cursor relative to the container
    const cursorXContainer = e.pageX - containerLeft - window.scrollX;
    const cursorYContainer = e.pageY - containerTop - window.scrollY;
    
    // Position of cursor relative to the image
    const cursorXImage = e.pageX - imgLeft - window.scrollX;
    const cursorYImage = e.pageY - imgTop - window.scrollY;


    // Check if cursor is inside the image bounds
    if (cursorXImage > 0 && cursorXImage < imgWidth && cursorYImage > 0 && cursorYImage < imgHeight) {
      if (!showZoom) setShowZoom(true);
    } else {
      if (showZoom) setShowZoom(false);
      return;
    }

    setCursorPosition({ x: cursorXContainer, y: cursorYContainer });

    setPosition({
      x: -((cursorXImage * zoomLevel) - (loupeSize / 2)),
      y: -((cursorYImage * zoomLevel) - (loupeSize / 2)),
    });
  };
  
  const handleMouseLeave = () => {
      if (showZoom) setShowZoom(false);
  };
  
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-md shadow-lg cursor-crosshair"
      />
      {showZoom && (
        <div
          style={{
            position: 'absolute',
            left: `${cursorPosition.x - loupeSize / 2}px`,
            top: `${cursorPosition.y - loupeSize / 2}px`,
            width: `${loupeSize}px`,
            height: `${loupeSize}px`,
            pointerEvents: 'none',
            border: '3px solid white',
            borderRadius: '50%',
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${imgRef.current!.width * zoomLevel}px ${imgRef.current!.height * zoomLevel}px`,
            backgroundPosition: `${position.x}px ${position.y}px`,
            boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
};

export default ImageZoom;
