import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { Job } from '../../types';

interface RemindersBannerProps {
  reminders: Job[];
  onGenerateFollowUp: (id: number) => void;
  onSnooze: (id: number) => void;
  onContacted: (id: number) => void;
}

export default function RemindersBanner({ reminders, onGenerateFollowUp, onSnooze, onContacted }: RemindersBannerProps) {
  if (reminders.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="mb-8 overflow-hidden"
      >
        <div className="bg-[#fff9eb] border border-[#ffeeba] p-5 rounded-[20px] flex flex-col gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-[#fef3c7] rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#d97706]" />
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-[#92400e]">Follow-up reminders</h4>
              <p className="text-[13px] text-[#b45309]">
                {reminders.length} application(s) in &quot;Applied&quot; for over a week — time to nudge or log contact.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {reminders.map((job) => (
              <div
                key={job.id}
                className="flex flex-wrap items-center gap-2 p-3 bg-white/80 rounded-[14px] border border-[#ffeeba]"
              >
                <span className="text-[13px] font-medium text-[#92400e]">{job.company} — {job.role}</span>
                <div className="flex flex-wrap gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => onGenerateFollowUp(job.id)}
                    className="px-3 py-1.5 bg-[#111111] text-white text-[12px] font-semibold rounded-lg"
                  >
                    Draft follow-up
                  </button>
                  <button
                    type="button"
                    onClick={() => onSnooze(job.id)}
                    className="px-3 py-1.5 border border-[#fcd34d] text-[#92400e] text-[12px] font-medium rounded-lg hover:bg-[#fffbeb]"
                  >
                    Snooze 7d
                  </button>
                  <button
                    type="button"
                    onClick={() => onContacted(job.id)}
                    className="px-3 py-1.5 border border-[#86efac] text-[#166534] text-[12px] font-medium rounded-lg hover:bg-[#f0fdf4]"
                  >
                    Mark contacted
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
