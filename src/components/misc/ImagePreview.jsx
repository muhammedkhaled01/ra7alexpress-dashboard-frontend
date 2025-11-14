import React from 'react';
import { Dialog, DialogTrigger, DialogOverlay, DialogContent, DialogClose } from '../ui/dialog';
import { FileText, Download, Eye } from 'lucide-react';

const ImagePreview = ({ src, alt, fileName = '' }) => {
    // Check if it's an image file
    const isImage = (fileName || src).match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
    const isPDF = (fileName || src).match(/\.pdf$/i);
    const isDoc = (fileName || src).match(/\.(doc|docx)$/i);
    
    const getFileIcon = () => {
        if (isPDF) return <FileText className="w-6 h-6 text-red-600" />;
        if (isDoc) return <FileText className="w-6 h-6 text-blue-600" />;
        return <FileText className="w-6 h-6 text-gray-600" />;
    };

    const handleDownload = (e) => {
        e.stopPropagation();
        window.open(src, '_blank');
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer group">
                    {isImage ? (
                        <img
                            src={src}
                            alt={alt || 'File Thumbnail'}
                            className="w-20 h-20 object-cover rounded-md border border-gray-200 hover:border-gray-300 transition-all"
                            loading="lazy"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div 
                        className={`${isImage ? 'hidden' : 'flex'} w-20 h-20 border border-gray-200 rounded-md items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all flex-col`}
                        style={{ display: isImage ? 'none' : 'flex' }}
                    >
                        {getFileIcon()}
                        <span className="text-xs text-gray-500 mt-1 truncate max-w-full px-1">
                            {fileName ? fileName.split('.').pop()?.toUpperCase() : 'FILE'}
                        </span>
                    </div>
                </div>
            </DialogTrigger>
            <DialogOverlay />
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <div className="relative">
                    <DialogClose className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md text-gray-500 hover:text-gray-700" />
                    
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold truncate">{alt || 'Document Preview'}</h3>
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                    </div>

                    {isImage ? (
                        <img
                            src={src}
                            alt={alt || 'Document Preview'}
                            className="max-w-full max-h-[70vh] object-contain rounded-md mx-auto block"
                        />
                    ) : isPDF ? (
                        <div className="w-full h-[70vh] border rounded-md overflow-hidden">
                            <iframe
                                src={`${src}#view=FitH`}
                                className="w-full h-full"
                                title={alt || 'PDF Document'}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] border rounded-md bg-gray-50">
                            <div className="flex flex-col items-center gap-4">
                                {getFileIcon()}
                                <div className="text-center">
                                    <p className="text-lg font-medium text-gray-700">
                                        {alt || 'Document'}
                                    </p>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Preview not available for this file type
                                    </p>
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mx-auto"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View Document
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ImagePreview;
