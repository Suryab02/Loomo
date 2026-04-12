import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Job } from '../../types';

interface GmailSyncBannerProps {
  foundJobs: Partial<Job>[];
  onAccept: (index: number) => void;
  onDismissAll: () => void;
}

export default function GmailSyncBanner({ foundJobs, onAccept, onDismissAll }: GmailSyncBannerProps) {
  if (foundJobs.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-8 p-6 bg-[#fafafa] border border-[#ededed] rounded-[24px] shadow-sm"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[17px] font-semibold text-[#111111] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#737373]" />
            Found in your Gmail
          </h3>
          <button
            type="button"
            onClick={onDismissAll}
            className="text-[12px] text-[#737373] hover:text-[#111111]"
          >
            Dismiss all
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {foundJobs.map((job, idx) => (
            <div
              key={`${job.company}-${job.role}-${idx}`}
              className="p-4 bg-white border border-[#ededed] rounded-[16px] flex justify-between items-center group hover:border-[#111111] transition-all"
            >
              <div>
                <h4 className="text-sm font-bold text-[#111111]">{job.role || 'Unknown Role'}</h4>
                <p className="text-[12px] text-[#737373]">{job.company || 'Unknown Company'}</p>
              </div>
              <button
                type="button"
                onClick={() => onAccept(idx)}
                className="px-4 py-1.5 bg-[#111111] text-white text-[12px] font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Track Job
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
