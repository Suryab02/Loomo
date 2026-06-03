import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Briefcase, ChevronRight } from 'lucide-react';
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
        exit={{ opacity: 0, scale: 0.95 }}
        className="mb-8 p-6 bg-gradient-to-br from-[#fafafa] to-[#f4f4f5] border border-[#ededed] rounded-[24px] shadow-sm relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[17px] font-semibold text-[#111111] flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                <Sparkles className="w-4 h-4" />
              </span>
              Found in your Gmail
            </h3>
            <button
              type="button"
              onClick={onDismissAll}
              className="text-[13px] font-medium text-[#737373] hover:text-[#111111] transition-colors"
            >
              Dismiss all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {foundJobs.map((job, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={`${job.company}-${job.role}-${idx}`}
                  className="p-4 bg-white border border-[#ededed] rounded-[16px] flex justify-between items-center group hover:border-[#d4d4d8] hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f4f4f5] flex items-center justify-center text-[#a1a1aa] group-hover:text-[#111111] transition-colors shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#111111] line-clamp-1">{job.role || 'Unknown Role'}</h4>
                      <p className="text-[13px] text-[#737373] line-clamp-1">{job.company || 'Unknown Company'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAccept(idx)}
                    className="flex shrink-0 items-center gap-1 px-3 py-1.5 bg-gradient-to-b from-[#27272a] to-[#111111] text-white text-[12px] font-semibold rounded-full opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-105 active:scale-95 ml-2 shadow-sm"
                  >
                    Track <ChevronRight className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
