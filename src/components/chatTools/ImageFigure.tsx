import React, { useState, useEffect, useCallback } from "react";

interface ImageFigureProps {
  imageData: { [key: string]: string };
}

export const ImageFigure: React.FC<ImageFigureProps> = ({ imageData }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = useCallback(() => setIsOpen(false), []);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleClose]);

  return (
    <>
      <div
  className="mt-4 rounded-lg overflow-hidden border border-border bg-card p-4 flex justify-center items-center cursor-pointer hover:opacity-80 transition"
        onClick={handleOpen}
      >
        <h3 className="sr-only">Image:</h3>
        <img
          src={`data:image/png;base64,${imageData["image/png"]}`}
          alt="image"
          className="max-w-full h-auto"
        />
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1e1e]/90 backdrop-blur-sm px-4 md:px-6"
          style={{ backdropFilter: "blur(8px)" }}
          onClick={handleClose}
        >
          {/* X Close Button */}
          <button
            aria-label="Close image fullscreen"
            onClick={handleClose}
            className="absolute top-4 right-4 md:top-8 md:right-8 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 z-50 focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
            style={{ fontSize: 24 }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={`data:image/png;base64,${imageData["image/png"]}`}
            alt="image fullscreen"
            className="max-w-full max-h-full shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
