import React, { useState } from 'react';
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '../ui/dialog';

const ImageHoverPreview = ({ src, alt, hover = true }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div 
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            className="relative"
        >
            <img
                src={src}
                alt={alt || 'Image Thumbnail'}
                className="cursor-pointer w-20 h-20 object-cover rounded-md"
                loading="lazy"
            />
            {isOpen && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogOverlay className="fixed inset-0 bg-black/50" />
                    <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
                        <div className="relative">
                            <DialogClose 
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-60" 
                                onClick={() => setIsOpen(false)}
                            />
                            <img
                                src={src}
                                alt={alt || 'Image Preview'}
                                className="max-w-full max-h-[80vh] object-contain rounded-md"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default ImageHoverPreview;
