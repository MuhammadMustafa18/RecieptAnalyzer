import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import Tesseract from 'tesseract.js';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ParsedResult {
    id: string;
    merchant: string;
    total: number;
    date: string;
    category: string;
    rawText: string;
}

interface ReceiptUploaderProps {
    onResult: (data: ParsedResult) => void;
}

export default function ReceiptUploader({ onResult }: ReceiptUploaderProps) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File | undefined) => {
        if (!file) return;

        setLoading(true);
        setStatus('Initializing AI Engine...');
        setProgress(0);

        try {
            const result = await Tesseract.recognize(
                file,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.floor(m.progress * 100));
                            setStatus('Extracting Intelligence...');
                        }
                    }
                }
            );

            const parsedData = parseOCRText(result.data.text);
            onResult(parsedData);
            setStatus('Capture Successful!');
        } catch (error) {
            console.error('OCR Error:', error);
            setStatus('Capture Failed');
        } finally {
            setTimeout(() => setLoading(false), 1000);
        }
    };

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        handleUpload(file);
    };

    const handleDrag = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const parseOCRText = (text: string): ParsedResult => {
        const lines = text.split('\n');
        let total = 0;
        let date = new Date().toISOString().split('T')[0];
        let merchant = "Unknown Merchant";

        const totalRegex = /(TOTAL|AMOUNT|DUE|BALANCE|NET)[\s:]*[\$]?\s*(\d+[\.,]\d{2})/i;
        const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;

        lines.forEach((line: string, index: number) => {
            if (index < 3 && line.trim().length > 3 && merchant === "Unknown Merchant") {
                merchant = line.trim();
            }

            const totalMatch = line.match(totalRegex);
            if (totalMatch) {
                total = parseFloat(totalMatch[2].replace(',', '.'));
            }

            const dateMatch = line.match(dateRegex);
            if (dateMatch && date === new Date().toISOString().split('T')[0]) {
                let rawDate = dateMatch[1].replace(/[\/\.]/g, '-');
                const parts = rawDate.split('-');
                if (parts.length === 3) {
                    if (parts[2].length === 4) {
                        date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    } else if (parts[0].length === 4) {
                        date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                    }
                }
            }
        });

        return {
            id: Math.random().toString(36).substr(2, 9),
            merchant,
            total,
            date,
            category: 'General',
            rawText: text
        };
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-8 rounded-[2rem] border border-zinc-800 bg-zinc-950/50"
        >
            <div
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-[1.5rem] p-10 transition-all duration-300 overflow-hidden ${dragActive ? 'border-primary bg-primary/5' : 'border-zinc-800 bg-zinc-900/30'
                    } ${loading ? 'cursor-wait' : 'cursor-pointer hover:border-zinc-700 hover:bg-zinc-900/50'}`}
                onClick={() => !loading && fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={onFileChange}
                    disabled={loading}
                />

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center space-y-6 w-full"
                        >
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-2 border-zinc-800 border-t-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-primary">{progress}%</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-zinc-400 font-bold tracking-tight text-sm uppercase">{status}</p>
                                <div className="w-40 h-1 bg-zinc-900 rounded-full mt-4 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                                <ImageIcon className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Capture Intelligence</h3>
                            <p className="text-zinc-500 text-xs mt-2 text-center max-w-[180px] font-medium leading-relaxed">
                                Drop your receipt here to begin the capture process
                            </p>
                            <div className="mt-8 flex items-center gap-2 px-3 py-1.5 bg-zinc-950/50 rounded-full border border-zinc-900 text-[10px] font-bold text-zinc-600">
                                <Sparkles className="w-3 h-3 text-primary" />
                                POWERED BY AI OCR
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
