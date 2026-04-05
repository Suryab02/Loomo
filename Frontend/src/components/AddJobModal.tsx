import { motion } from 'framer-motion';
import { Sparkles, X, Building2, MapPin, DollarSign, Target, Loader2, Link2 } from 'lucide-react';
import { useState, Dispatch, SetStateAction } from 'react';
import { Job } from '../types';
import { useParseJobUrlMutation } from '../store/apiSlice';
import { getErrorMessage } from '../lib/apiError';

interface AddJobModalProps {
  onClose: () => void;
  pasteText: string;
  setPasteText: Dispatch<SetStateAction<string>>;
  handleParseJob: () => void;
  parsing: boolean;
  newJob: Partial<Job>;
  setNewJob: Dispatch<SetStateAction<Partial<Job>>>;
  handleAddJob: () => void;
  adding: boolean;
  toast?: (msg: string, type: 'success' | 'error') => void;
}

export default function AddJobModal({
  onClose,
  pasteText,
  setPasteText,
  handleParseJob,
  parsing,
  newJob,
  setNewJob,
  handleAddJob,
  adding,
  toast,
}: AddJobModalProps) {
  const [jobUrl, setJobUrl] = useState('');
  const [parseJobUrl, { isLoading: fetchingUrl }] = useParseJobUrlMutation();

  const handleFetchUrl = async () => {
    if (!jobUrl.trim()) return;
    try {
      const res = await parseJobUrl({ url: jobUrl.trim() }).unwrap();
      setNewJob((prev) => ({
        ...prev,
        ...res,
        job_url: jobUrl.trim(),
        job_description: prev.job_description || res.job_description || '',
      }));
      toast?.('Loaded details from URL — review before saving.', 'success');
    } catch (e) {
      toast?.(getErrorMessage(e, 'Could not parse this URL. Paste the description instead.'), 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-[20px] p-7 w-full max-w-[500px] shadow-2xl border border-[#ededed] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-[#111111]">New Application</h3>
          <button type="button" onClick={onClose} className="text-[#a3a3a3] hover:text-[#111111] p-1 bg-[#f7f7f7] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-5 flex gap-2">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 absolute left-3 top-3 text-[#a3a3a3]" />
            <input
              placeholder="Job posting URL (optional)"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleFetchUrl}
            disabled={fetchingUrl || !jobUrl.trim()}
            className="shrink-0 px-4 py-2.5 rounded-[12px] bg-[#f7f7f7] border border-[#ededed] text-sm font-semibold disabled:opacity-40"
          >
            {fetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
          </button>
        </div>

        <div className="mb-6 bg-[#f7f7f7] p-5 rounded-[24px] border border-[#ededed]">
          <textarea
            placeholder="Or paste raw job description here..."
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            className="w-full p-4 rounded-[18px] border border-[#ededed] bg-white text-[13px] outline-none text-[#111111] resize-none mb-4 placeholder:text-[#a3a3a3] focus:border-[#a3a3a3] transition-colors"
          />
          <button
            type="button"
            onClick={handleParseJob}
            disabled={parsing || !pasteText}
            className="w-full py-3 rounded-[14px] bg-[#111111] disabled:bg-[#f5f5f5] disabled:text-[#a3a3a3] text-white font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
          >
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {parsing ? 'Extracting...' : 'Extract from paste'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { name: 'company', icon: Building2, ph: 'Company' },
            { name: 'role', icon: Target, ph: 'Role' },
            { name: 'location', icon: MapPin, ph: 'Location' },
            { name: 'salary_range', icon: DollarSign, ph: 'Salary' },
          ].map((field) => (
            <div key={field.name} className="relative">
              <field.icon className="w-4 h-4 absolute left-3 top-3 text-[#a3a3a3]" />
              <input
                placeholder={field.ph}
                value={(newJob as any)[field.name] || ''}
                onChange={(e) => setNewJob({ ...newJob, [field.name]: e.target.value })}
                className="w-full pl-9 pr-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm text-[#111111] outline-none focus:border-[#a3a3a3] transition-colors placeholder:text-[#a3a3a3]"
              />
            </div>
          ))}
        </div>

        <textarea
          placeholder="Full job description for match scoring (optional)"
          value={newJob.job_description || ''}
          onChange={(e) => setNewJob({ ...newJob, job_description: e.target.value })}
          rows={2}
          className="w-full p-3 rounded-[12px] border border-[#ededed] text-sm text-[#111111] outline-none resize-none mb-6 focus:border-[#a3a3a3] transition-colors placeholder:text-[#a3a3a3]"
        />

        <button
          type="button"
          onClick={handleAddJob}
          disabled={adding || !newJob.company || !newJob.role}
          className="w-full py-3.5 rounded-[16px] bg-[#111111] disabled:bg-[#f5f5f5] disabled:text-[#d4d4d4] text-white font-bold text-sm transition-all shadow-md active:scale-[0.98]"
        >
          {adding ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : 'Save Application'}
        </button>

      </motion.div>
    </motion.div>
  );
}
