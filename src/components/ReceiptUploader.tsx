import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReceiptUploader({ onResult }) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleUpload = async (file) => {
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

    const onFileChange = (e) => {
        const file = e.target.files?.[0];
        handleUpload(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const parseOCRText = (text) => {
        const lines = text.split('\n');
        let total = 0;
        let date = new Date().toISOString().split('T')[0];
        let merchant = "Unknown Merchant";

        const totalRegex = /(TOTAL|AMOUNT|DUE|BALANCE|NET)[\s:]*[\$]?\s*(\d+[\.,]\d{2})/i;
        const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;

        lines.forEach((line, index) => {
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white/50"
        >
            <div
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-12 transition-all duration-500 overflow-hidden ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/30'
                    } ${loading ? 'cursor-wait' : 'cursor-pointer hover:border-indigo-400 hover:bg-white/50'}`}
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center space-y-6 w-full"
                        >
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-black text-indigo-600">{progress}%</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <p className="text-slate-800 font-black tracking-tight text-lg">{status}</p>
                                <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-indigo-600"
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
                            <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/40 animate-pulse">
                                <ImageIcon className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Capture Intelligence</h3>
                            <p className="text-slate-500 text-sm mt-2 text-center max-w-[200px] font-medium leading-relaxed">
                                Drop your receipt here to begin the capture process
                            </p>
                            <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm text-xs font-bold text-slate-400">
                                <Sparkles className="w-3 h-3 text-indigo-500" />
                                Powered by AI OCR
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
