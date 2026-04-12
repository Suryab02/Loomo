import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Upload, Target, Loader2, Search, SlidersHorizontal } from 'lucide-react';
import {
  useGetStatsQuery,
  useGetJobsQuery,
  useGetRemindersQuery,
  useAddJobMutation,
  useDeleteJobMutation,
  useParseJobTextMutation,
  useUploadResumeMutation,
  useSnoozeReminderMutation,
  useMarkReminderContactedMutation,
  useSyncGmailMutation,
  useGenerateCoverLetterMutation,
  useGenerateFollowUpMutation,
} from '../store/apiSlice';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import JobRow from '../components/JobRow';
import AddJobModal from '../components/AddJobModal';
import AIDraftModal from '../components/AIDraftModal';
import JobDetailPanel from '../components/JobDetailPanel';
import RemindersBanner from '../components/dashboard/RemindersBanner';
import GmailSyncBanner from '../components/dashboard/GmailSyncBanner';
import { DashboardSkeleton } from '../components/PageSkeleton';
import { useToast } from '../context/ToastContext';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import type { Job, JobStatus } from '../types';
import { getErrorMessage } from '../lib/apiError';

function Dashboard() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters hook
  const { searchInput, setSearchInput, listParams, setListParams, resetFilters } = useDashboardFilters();

  // Queries
  const { data: stats, isLoading: statsLoading } = useGetStatsQuery();
  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery(listParams);
  const { data: reminders = [] } = useGetRemindersQuery();

  // Mutations
  const [addJob] = useAddJobMutation();
  const [deleteJob] = useDeleteJobMutation();
  const [parseJobText, { isLoading: parsing }] = useParseJobTextMutation();
  const [uploadResume] = useUploadResumeMutation();
  const [snoozeReminder] = useSnoozeReminderMutation();
  const [markReminderContacted] = useMarkReminderContactedMutation();
  const [syncGmail, { isLoading: syncingGmail }] = useSyncGmailMutation();
  const [generateCoverLetter, { isLoading: generatingLetter }] = useGenerateCoverLetterMutation();
  const [generateFollowUp] = useGenerateFollowUpMutation();

  // Local UI State
  const [foundJobs, setFoundJobs] = useState<Partial<Job>[]>([]);
  const [showAddJob, setShowAddJob] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [uploadingResume, setUploadingResume] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    company: '', role: '', job_description: '', platform: '', location: '', salary_range: '', job_url: '',
  });
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [letterTitle, setLetterTitle] = useState('Draft');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const handleParseJob = async () => {
    if (!pasteText) return;
    try {
      const res = await parseJobText({ text: pasteText }).unwrap();
      setNewJob((prev) => ({ ...prev, ...res, job_description: pasteText }));
      setPasteText('');
      toast('Job details extracted', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to parse the job text.'), 'error');
    }
  };

  const handleAddJob = async () => {
    setAdding(true);
    try {
      await addJob(newJob).unwrap();
      setShowAddJob(false);
      setNewJob({ company: '', role: '', job_description: '', platform: '', location: '', salary_range: '', job_url: '' });
      toast('Application saved', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Could not save application'), 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleResumeReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      await uploadResume(file).unwrap();
      toast('Resume processed — skills updated.', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to parse resume.'), 'error');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await deleteJob(id).unwrap();
      toast('Application removed', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to delete application.'), 'error');
    }
  };

  const handleGenerateLetter = async (id: number) => {
    setLetterTitle('Draft Cover Letter');
    try {
      const res = await generateCoverLetter(id).unwrap();
      setGeneratedLetter(res.cover_letter);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to generate cover letter. Ensure the job has a description.'), 'error');
    }
  };

  const handleGenerateFollowUp = async (id: number) => {
    setLetterTitle('Follow-up email');
    try {
      const res = await generateFollowUp(id).unwrap();
      setGeneratedLetter(res.follow_up_email);
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to generate follow-up email.'), 'error');
    }
  };

  const handleSyncGmail = async () => {
    try {
      const res = await syncGmail().unwrap();
      setFoundJobs(res.jobs_found || []);
      toast(`Found ${(res.jobs_found || []).length} message(s). Review and import.`, 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Gmail sync failed'), 'error');
    }
  };

  const handleAcceptGmailJob = async (jobIndex: number) => {
    const job = foundJobs[jobIndex];
    try {
      await addJob(job).unwrap();
      setFoundJobs((prev) => prev.filter((_, i) => i !== jobIndex));
      toast('Imported from Gmail', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Could not import job'), 'error');
    }
  };

  const handleSnooze = async (jobId: number) => {
    try {
      await snoozeReminder({ id: jobId, days: 7 }).unwrap();
      toast('Reminder snoozed 7 days', 'success');
    } catch (e) {
      toast(getErrorMessage(e, 'Could not snooze'), 'error');
    }
  };

  const handleContacted = async (jobId: number) => {
    try {
      await markReminderContacted(jobId).unwrap();
      toast('Marked as contacted', 'success');
    } catch (e) {
      toast(getErrorMessage(e, 'Could not update'), 'error');
    }
  };

  if (statsLoading || jobsLoading) return <DashboardSkeleton />;

  const statCards = [
    { label: 'Applied', value: stats?.applied ?? 0 },
    { label: 'Interviews', value: stats?.interview ?? 0 },
    { label: 'Offers', value: stats?.offer ?? 0 },
    { label: 'Response Rate', value: `${stats?.response_rate ?? 0}%` },
  ];

  const jobs = jobsData?.items || [];
  const jobsTotal = jobsData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(jobsTotal / listParams.per_page));

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Dashboard</h1>
            <p className="text-[#737373] text-sm mt-1">Track and manage your career progress.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleResumeReupload} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingResume}
              className="group flex items-center gap-2 px-5 py-2.5 bg-[#f7f7f7] hover:bg-[#ededed] text-[#111111] text-sm font-semibold rounded-full border border-[#ededed] transition-all disabled:opacity-50"
            >
              {uploadingResume ? <Upload className="w-4 h-4 text-[#737373]" /> : <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
              {uploadingResume ? 'Processing...' : 'Re-sync Resume'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddJob(true)}
              className="group flex items-center gap-2 px-5 py-2.5 bg-[#111111] hover:bg-[#262626] text-white text-sm font-semibold rounded-full transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Add Application
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((card, i) => (
            <StatCard key={card.label} label={card.label} value={card.value} index={i} />
          ))}
        </div>

        <GmailSyncBanner 
          foundJobs={foundJobs} 
          onAccept={handleAcceptGmailJob} 
          onDismissAll={() => setFoundJobs([])} 
        />

        <RemindersBanner 
          reminders={reminders}
          onGenerateFollowUp={handleGenerateFollowUp}
          onSnooze={handleSnooze}
          onContacted={handleContacted}
        />

        <div className="border border-[#ededed] rounded-[16px] bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-[#ededed] flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm font-medium text-[#111111]">
              <span>Applications</span>
              <span className="text-[#737373] font-normal">{jobsTotal} total</span>
            </div>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search company or role..."
                  className="w-full pl-9 pr-3 py-2 rounded-[12px] border border-[#ededed] text-sm outline-none focus:border-[#a3a3a3]"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <SlidersHorizontal className="w-4 h-4 text-[#a3a3a3] hidden sm:block" />
                <select
                  value={listParams.status}
                  onChange={(e) => setListParams((p) => ({ ...p, status: e.target.value as JobStatus, page: 1 }))}
                  className="text-sm border border-[#ededed] rounded-[12px] px-3 py-2 bg-white capitalize"
                >
                  <option value="">All statuses</option>
                  {['wishlist', 'applied', 'screening', 'interview', 'offer', 'rejected'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  placeholder="Platform"
                  value={listParams.platform}
                  onChange={(e) => setListParams((p) => ({ ...p, platform: e.target.value, page: 1 }))}
                  className="text-sm border border-[#ededed] rounded-[12px] px-3 py-2 w-[120px]"
                />
                <select
                  value={listParams.sort}
                  onChange={(e) => setListParams((p) => ({ ...p, sort: e.target.value, page: 1 }))}
                  className="text-sm border border-[#ededed] rounded-[12px] px-3 py-2 bg-white"
                >
                  <option value="created_at">Sort: Added</option>
                  <option value="applied_date">Sort: Applied date</option>
                  <option value="match_score">Sort: Match</option>
                  <option value="company">Sort: Company</option>
                </select>
                <select
                  value={listParams.order}
                  onChange={(e) => setListParams((p) => ({ ...p, order: e.target.value as 'asc'|'desc', page: 1 }))}
                  className="text-sm border border-[#ededed] rounded-[12px] px-3 py-2 bg-white"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <Target className="w-10 h-10 text-[#ededed] mb-4" />
              <p className="text-[#111111] font-medium text-sm">No applications match your filters</p>
              <p className="text-[#737373] text-sm mt-1 text-balance max-w-sm">Try clearing search or add a new role with Add Application — paste a job description to extract fields with AI.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 text-sm font-semibold text-[#111111] underline underline-offset-4"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <motion.div layout className="divide-y divide-[#ededed]">
              <AnimatePresence initial={false} mode="popLayout">
                {jobs.map((job) => (
                  <JobRow
                    key={job.id}
                    job={job}
                    onOpen={setSelectedJob}
                    onDelete={handleDeleteJob}
                    onGenerateLetter={handleGenerateLetter}
                    isGenerating={generatingLetter}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#ededed] flex justify-between items-center text-sm">
              <button
                type="button"
                disabled={listParams.page <= 1}
                onClick={() => setListParams((p) => ({ ...p, page: p.page - 1 }))}
                className="font-medium text-[#111111] disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-[#737373]">Page {listParams.page} / {totalPages}</span>
              <button
                type="button"
                disabled={listParams.page >= totalPages}
                onClick={() => setListParams((p) => ({ ...p, page: p.page + 1 }))}
                className="font-medium text-[#111111] disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="mt-20 pt-8 border-t border-[#f7f7f7] flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-sm font-bold text-[#111111] mb-1">Workspace Tools</h4>
            <p className="text-[12px] text-[#a3a3a3]">Experimental integrations for advanced users.</p>
          </div>

          <button
            type="button"
            onClick={handleSyncGmail}
            disabled={syncingGmail}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#f7f7f7] text-[#111111] text-[12px] font-bold rounded-full border border-[#ededed] shadow-sm transition-all disabled:opacity-50 active:scale-95"
          >
            {syncingGmail ? <Loader2 className="w-4 h-4 opacity-0" /> : <Loader2 className="w-4 h-4" />}
            {syncingGmail ? 'Syncing...' : 'Sync Gmail (Beta)'}
          </button>
        </div>
      </main>

      {showAddJob && (
        <AddJobModal
          onClose={() => setShowAddJob(false)}
          pasteText={pasteText}
          setPasteText={setPasteText}
          handleParseJob={handleParseJob}
          parsing={parsing}
          newJob={newJob}
          setNewJob={setNewJob}
          handleAddJob={handleAddJob}
          adding={adding}
          toast={toast}
        />
      )}

      {selectedJob && (
        <JobDetailPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onSaved={() => setSelectedJob(null)}
          toast={toast}
        />
      )}

      <AIDraftModal 
        content={generatedLetter} 
        title={letterTitle} 
        onClose={() => setGeneratedLetter(null)} 
      />
    </div>
  );
}

export default Dashboard;
