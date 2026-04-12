import { motion } from 'framer-motion';
import { FileText, X, Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface AIDraftModalProps {
  content: string | null;
  title: string;
  onClose: () => void;
}

export default function AIDraftModal({ content, title, onClose }: AIDraftModalProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!content) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-[600px] flex flex-col max-h-[85vh]"
      >
        <div className="p-6 border-b border-[#ededed] flex justify-between items-center bg-[#fdfdfd] rounded-t-[24px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f5f3ff] rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#6d28d9]" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-[#111111]">{title}</h3>
              <p className="text-[12px] text-[#737373]">Generated with Loomo AI</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-[#a3a3a3] hover:bg-[#f7f7f7] rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed text-[#404040]">
          {content}
        </div>

        <div className="p-6 border-t border-[#ededed] flex gap-3">
          <button
            type="button"
            onClick={copyToClipboard}
            className="flex-1 py-3 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6d28d9]/20"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-[#ededed] hover:bg-[#f7f7f7] text-[#111111] rounded-[14px] font-semibold text-sm transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
