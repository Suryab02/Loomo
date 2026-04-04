import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, RefreshCw } from 'lucide-react';
import { patchJob } from '../services/api';
import { Job, JobStatus } from '../types';

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
  const [form, setForm] = useState<JobFormState>({
    company: '',
    role: '',
    job_description: '',
    job_url: '',
    salary_range: '',
    location: '',
    platform: '',
    notes: '',
    contact_name: '',
    contact_email: '',
    status: 'wishlist',
    applied_date: '',
    follow_up_date: '',
  });
  const [saving, setSaving] = useState(false);
  const [recalc, setRecalc] = useState(false);

  useEffect(() => {
    if (!job) return;
    setForm({
      company: job.company || '',
      role: job.role || '',
      job_description: job.job_description || '',
      job_url: job.job_url || '',
      salary_range: job.salary_range || '',
      location: job.location || '',
      platform: job.platform || '',
      notes: (job as any).notes || '',
      contact_name: (job as any).contact_name || '',
      contact_email: (job as any).contact_email || '',
      status: job.status || 'wishlist',
      applied_date: isoLocal(job.applied_date),
      follow_up_date: isoLocal((job as any).follow_up_date),
    });
    setRecalc(false);
  }, [job]);

  if (!job) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        company: form.company,
        role: form.role,
        job_description: form.job_description || null,
        job_url: form.job_url || null,
        salary_range: form.salary_range || null,
        location: form.location || null,
        platform: form.platform || null,
        notes: form.notes || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        status: form.status,
        recalculate_match: recalc,
      };
      if (form.applied_date) {
        payload.applied_date = new Date(form.applied_date).toISOString();
      }
      if (form.follow_up_date) {
        payload.follow_up_date = new Date(form.follow_up_date).toISOString();
      }
      await patchJob(job.id, payload);
      toast?.('Application updated', 'success');
      onSaved?.();
      onClose();
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Could not save';
      toast?.(typeof msg === 'string' ? msg : 'Could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex justify-end bg-black/30 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full max-w-[440px] h-full bg-white shadow-2xl flex flex-col border-l border-[#ededed]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#ededed] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-[#111111]">Edit application</h2>
            <p className="text-xs text-[#737373] mt-0.5">Update details and match score</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-[#f7f7f7] text-[#737373]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Company</label>
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className="col-span-2 px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
            />
            <label className="col-span-2 text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Role</label>
            <input
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="col-span-2 px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as JobStatus }))}
              className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm capitalize"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Job URL</label>
            <input
              value={form.job_url}
              onChange={(e) => setForm((f) => ({ ...f, job_url: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Platform</label>
              <input
                value={form.platform}
                onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Salary</label>
            <input
              value={form.salary_range}
              onChange={(e) => setForm((f) => ({ ...f, salary_range: e.target.value }))}
              className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Job description</label>
            <textarea
              value={form.job_description}
              onChange={(e) => setForm((f) => ({ ...f, job_description: e.target.value }))}
              rows={5}
              className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#111111] cursor-pointer">
            <input type="checkbox" checked={recalc} onChange={(e) => setRecalc(e.target.checked)} className="rounded border-[#d4d4d4]" />
            <RefreshCw className="w-4 h-4 text-[#737373]" />
            Recalculate match vs. resume
          </label>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Applied (local)</label>
              <input
                type="datetime-local"
                value={form.applied_date}
                onChange={(e) => setForm((f) => ({ ...f, applied_date: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Follow-up reminder</label>
              <input
                type="datetime-local"
                value={form.follow_up_date}
                onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Contact name</label>
              <input
                value={form.contact_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#737373] uppercase tracking-wide">Contact email</label>
              <input
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                className="mt-1 w-full px-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-[#ededed] flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-[14px] border border-[#ededed] text-sm font-semibold text-[#111111] hover:bg-[#f7f7f7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.company?.trim() || !form.role?.trim()}
            className="flex-1 py-3 rounded-[14px] bg-[#111111] text-white text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save
          </button>
        </div>
      </motion.aside>
    </motion.div>
  );
}
