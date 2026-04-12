import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, RefreshCw, FileText, MessageSquare, Briefcase } from 'lucide-react';
import { Job, JobStatus } from '../types';
import { usePatchJobMutation, useTailorResumeMutation, useMockInterviewMutation } from '../store/apiSlice';
import { getErrorMessage } from '../lib/apiError';

const STATUSES: JobStatus[] = ['wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected'];

function isoLocal(dt?: string) {
  if (!dt) return '';
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface JobDetailPanelProps {
  job: Job | null;
  onClose: () => void;
  onSaved?: () => void;
  toast?: (msg: string, type: 'success' | 'error') => void;
}

interface JobFormState {
  company: string;
  role: string;
  job_description: string;
  job_url: string;
  salary_range: string;
  location: string;
  platform: string;
  notes: string;
  contact_name: string;
  contact_email: string;
  status: JobStatus;
  applied_date: string;
  follow_up_date: string;
}

export default function JobDetailPanel({ job, onClose, onSaved, toast }: JobDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'resume' | 'interview'>('details');

  const [form, setForm] = useState<JobFormState>({
    company: '', role: '', job_description: '', job_url: '', salary_range: '',
    location: '', platform: '', notes: '', contact_name: '', contact_email: '',
    status: 'wishlist', applied_date: '', follow_up_date: '',
  });
  
  const [saving, setSaving] = useState(false);
  const [recalc, setRecalc] = useState(false);
  const [patchJob] = usePatchJobMutation();

  const [tailorResume, { isLoading: tailoring }] = useTailorResumeMutation();
  const [tailoredResume, setTailoredResume] = useState('');

  const [mockInterview, { isLoading: mocking }] = useMockInterviewMutation();
  const [mockHistory, setMockHistory] = useState<{ role: string; content: string }[]>([]);
  const [mockInput, setMockInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!job) return;
    setForm({
      company: job.company || '', role: job.role || '', job_description: job.job_description || '', 
      job_url: job.job_url || '', salary_range: job.salary_range || '', location: job.location || '', 
      platform: job.platform || '', notes: (job as any).notes || '', contact_name: (job as any).contact_name || '', 
      contact_email: (job as any).contact_email || '', status: job.status || 'wishlist', 
      applied_date: isoLocal(job.applied_date), follow_up_date: isoLocal((job as any).follow_up_date),
    });
    setRecalc(false);
    setActiveTab('details');
    setTailoredResume('');
    setMockHistory([]);
    setMockInput('');
  }, [job]);

  if (!job) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        company: form.company, role: form.role, job_description: form.job_description || null,
        job_url: form.job_url || null, salary_range: form.salary_range || null, location: form.location || null,
        platform: form.platform || null, notes: form.notes || null, contact_name: form.contact_name || null,
        contact_email: form.contact_email || null, status: form.status, recalculate_match: recalc,
      };
      if (form.applied_date) payload.applied_date = new Date(form.applied_date).toISOString();
      if (form.follow_up_date) payload.follow_up_date = new Date(form.follow_up_date).toISOString();
      await patchJob({ id: job.id, data: payload }).unwrap();
      toast?.('Application updated', 'success');
      onSaved?.();
      onClose();
    } catch (e) {
      toast?.(getErrorMessage(e, 'Could not save'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTailorResume = async () => {
    try {
      const res = await tailorResume(job.id).unwrap();
      setTailoredResume(res.tailored_resume);
    } catch (e) {
      toast?.(getErrorMessage(e, 'Could not tailor resume'), 'error');
    }
  };

  const handleMockInterview = async (e: FormEvent) => {
    e.preventDefault();
    if (!mockInput.trim() || mocking) return;
    const userMsg = { role: 'user', content: mockInput };
    const history = [...mockHistory, userMsg];
    setMockHistory(history);
    setMockInput('');
    try {
      const res = await mockInterview({ id: job.id, message_history: history }).unwrap();
      setMockHistory([...history, { role: 'assistant', content: res.reply }]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      toast?.(getErrorMessage(e, 'Interview error'), 'error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex justify-end bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-[480px] h-full bg-white shadow-2xl flex flex-col border-l border-[#ededed]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#ededed] flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#111111]">{job.role}</h2>
              <p className="text-sm text-[#737373] mt-0.5">{job.company}</p>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[#f7f7f7] text-[#737373]">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex gap-6 border-b border-[#ededed] -mb-5 px-1">
            <button 
              onClick={() => setActiveTab('details')}
              className={`py-3 text-sm font-semibold border-b-2 flex flex-row items-center gap-2 transition-colors ${activeTab === 'details' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#737373] hover:text-[#111111]'}`}
            >
              <Briefcase className="w-4 h-4" /> Details
            </button>
            <button 
              onClick={() => setActiveTab('resume')}
              className={`py-3 text-sm font-semibold border-b-2 flex flex-row items-center gap-2 transition-colors ${activeTab === 'resume' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#737373] hover:text-[#111111]'}`}
            >
              <FileText className="w-4 h-4" /> Tailor Resume
            </button>
            <button 
              onClick={() => setActiveTab('interview')}
              className={`py-3 text-sm font-semibold border-b-2 flex flex-row items-center gap-2 transition-colors ${activeTab === 'interview' ? 'border-[#111111] text-[#111111]' : 'border-transparent text-[#737373] hover:text-[#111111]'}`}
            >
              <MessageSquare className="w-4 h-4" /> Mock Interview
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 relative">
          
          {/* Details Tab */}
          <div style={{ display: activeTab === 'details' ? 'block' : 'none' }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Company</label>
              <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} className="col-span-2 px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm" />
              <label className="col-span-2 text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Role</label>
              <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="col-span-2 px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm" />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as JobStatus }))} className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm capitalize">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Job URL</label>
              <input value={form.job_url} onChange={(e) => setForm((f) => ({ ...f, job_url: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm" placeholder="https://..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Location</label>
                <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Platform</label>
                <input value={form.platform} onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Salary</label>
              <input value={form.salary_range} onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))} className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm" />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Job description</label>
              <textarea value={form.job_description} onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))} rows={5} className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm resize-none" />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#111111] cursor-pointer">
              <input type="checkbox" checked={recalc} onChange={(e) => setRecalc(e.target.checked)} className="rounded border-[#d4d4d4]" />
              <RefreshCw className="w-4 h-4 text-[#737373]" />
              Recalculate match vs. resume
            </label>
          </div>

          {/* Resume Tab */}
          {activeTab === 'resume' && (
            <div className="h-full flex flex-col">
              {!tailoredResume ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-[#d4d4d4] mx-auto mb-4" />
                  <h3 className="font-semibold text-[#111111] mb-2">Tailor Your Resume</h3>
                  <p className="text-sm text-[#737373] mb-6 px-4">Generate an ATS-optimized resume using your skills, tailored specifically for the <strong>{job.role}</strong> role.</p>
                  <button 
                    onClick={handleTailorResume} disabled={tailoring}
                    className="px-6 py-3 rounded-[12px] bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-sm font-semibold flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                  >
                    {tailoring ? <><Loader2 className="w-4 h-4 animate-spin" /> Tailoring...</> : 'Generate Resume'}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col -m-5 bg-[#fafafa]">
                  <div className="flex-1 p-5 overflow-auto custom-scrollbar">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-[#1111] bg-white border border-[#ededed] p-5 rounded-[10px] shadow-sm">{tailoredResume}</pre>
                  </div>
                  <div className="shrink-0 p-4 border-t border-[#ededed] bg-white text-center">
                    <button onClick={() => navigator.clipboard.writeText(tailoredResume)} className="text-sm font-semibold text-[#6d28d9] hover:underline">Copy to Clipboard</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interview Tab */}
          {activeTab === 'interview' && (
            <div className="h-full flex flex-col -m-5 relative bg-[#fafafa]">
              {mockHistory.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <MessageSquare className="w-12 h-12 text-[#d4d4d4] mx-auto mb-4" />
                  <h3 className="font-semibold text-[#111111] mb-2">Mock Interview</h3>
                  <p className="text-sm text-[#737373] mb-6">Start a conversation with an AI hiring manager. We'll ask you role-specific questions for <strong>{job.role}</strong>.</p>
                  <form onSubmit={handleMockInterview} className="flex flex-col gap-3">
                    <input value={mockInput} onChange={(e) => setMockInput(e.target.value)} placeholder="Type 'Hello, I'm ready' to begin..." className="w-full px-4 py-3 rounded-[12px] border border-[#ededed] text-sm outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]" />
                    <button disabled={mocking || !mockInput} type="submit" className="px-6 py-3 rounded-[12px] bg-[#111111] text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                      {mocking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Interview'}
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 pb-20 custom-scrollbar">
                    {mockHistory.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-[12px] text-sm ${msg.role === 'user' ? 'bg-[#111111] text-white rounded-br-sm' : 'bg-white border border-[#ededed] text-[#111111] rounded-bl-sm shadow-sm'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {mocking && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] p-3 rounded-[12px] text-sm bg-white border border-[#ededed] text-[#737373] rounded-bl-sm flex items-center gap-2 shadow-sm">
                          <Loader2 className="w-4 h-4 animate-spin" /> Interviewer is typing...
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-[#ededed]">
                    <form onSubmit={handleMockInterview} className="flex gap-2">
                      <input value={mockInput} onChange={(e) => setMockInput(e.target.value)} placeholder="Your answer..." className="flex-1 px-4 py-2.5 rounded-[12px] border border-[#ededed] text-sm outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]" disabled={mocking} />
                      <button disabled={mocking || !mockInput} type="submit" className="px-5 py-2.5 rounded-[12px] bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-sm font-semibold disabled:opacity-50">Send</button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {activeTab === 'details' && (
          <div className="p-5 border-t border-[#ededed] flex gap-3 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-[14px] border border-[#ededed] text-sm font-semibold text-[#111111] hover:bg-[#f7f7f7]">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving || !form.company?.trim() || !form.role?.trim()} className="flex-1 py-3 rounded-[14px] bg-[#111111] text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save Details
            </button>
          </div>
        )}
      </motion.aside>
    </motion.div>
  );
}
