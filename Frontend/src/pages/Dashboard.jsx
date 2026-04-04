import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, Target, FileText, Check, Copy, X, Loader2 } from 'lucide-react'
import { getStats, getJobs, getReminders, addJob, parseJobText, parseJobUrl, uploadResume, deleteJob, generateCoverLetter, generateFollowUp } from '../services/api'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import JobRow from '../components/JobRow'
import AddJobModal from '../components/AddJobModal'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [jobs, setJobs] = useState([])
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddJob, setShowAddJob] = useState(false)
  const [adding, setAdding] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [uploadingResume, setUploadingResume] = useState(false)
  const fileInputRef = useRef(null)
  const [newJob, setNewJob] = useState({
    company: '', role: '', job_description: '', platform: '', location: '', salary_range: ''
  })
  const [generatedLetter, setGeneratedLetter] = useState(null)
  const [generatingLetter, setGeneratingLetter] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes, remindersRes] = await Promise.all([getStats(), getJobs(), getReminders()])
      setStats(statsRes.data)
      setJobs(jobsRes.data)
      setReminders(remindersRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleParseJob = async () => {
    if (!pasteText) return;
    setParsing(true);
    try {
      const res = await parseJobText({ text: pasteText });
      setNewJob(prev => ({ ...prev, ...res.data, job_description: pasteText }));
      setPasteText('');
    } catch (err) {
      console.error(err);
      alert("Failed to parse the job text.");
    } finally {
      setParsing(false);
    }
  }

  const handleParseUrl = async (url) => {
    setParsing(true);
    try {
      const res = await parseJobUrl({ url });
      setNewJob(prev => ({ 
        ...prev, 
        ...res.data, 
        job_description: res.data.job_description || `Link: ${url}`,
        job_url: url 
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to parse the job link. The site might be blocked or formatted uniquely.");
    } finally {
      setParsing(false);
    }
  }

  const handleAddJob = async () => {
    setAdding(true)
    try {
      await addJob(newJob)
      setShowAddJob(false)
      setNewJob({ company: '', role: '', job_description: '', platform: '', location: '', salary_range: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const handleResumeReupload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      await uploadResume(file);
      alert("Success! Your skills and current role have been updated in the database based on the new resume.");
    } catch (err) {
      console.error(err);
      alert("Failed to parse resume.");
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await deleteJob(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete application.");
    }
  }

  const handleGenerateLetter = async (id) => {
    setGeneratingLetter(true)
    try {
      const res = await generateCoverLetter(id)
      setGeneratedLetter(res.data.cover_letter)
    } catch (err) {
      console.error(err)
      alert("Failed to generate cover letter. Ensure the job has a description.")
    } finally {
      setGeneratingLetter(false)
    }
  }

  const handleGenerateFollowUp = async (id) => {
    setGeneratingLetter(true)
    try {
      const res = await generateFollowUp(id)
      setGeneratedLetter(res.data.follow_up_email)
    } catch (err) {
      console.error(err)
      alert("Failed to generate follow-up email.")
    } finally {
      setGeneratingLetter(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-[#111111] rounded-[24px] flex items-center justify-center mb-6 shadow-xl">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-[#111111] tracking-tight mb-2">Preparing your workspace</h2>
        <p className="text-[#a3a3a3] text-sm animate-pulse">Syncing your job applications...</p>
        
        <button 
          onClick={fetchData}
          className="mt-10 text-[12px] font-bold text-[#111111] underline underline-offset-4 hover:text-[#737373] transition-colors"
        >
          Taking too long? Try refreshing
        </button>
      </motion.div>
    </div>
  )

  const statCards = [
    { label: 'Applied', value: stats?.applied ?? 0 },
    { label: 'Interviews', value: stats?.interview ?? 0 },
    { label: 'Offers', value: stats?.offer ?? 0 },
    { label: 'Response Rate', value: `${stats?.response_rate ?? 0}%` },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Dashboard</h1>
            <p className="text-[#737373] text-sm mt-1">Track and manage your career progress.</p>
          </div>
          
          <div className="flex gap-2">
            <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleResumeReupload} className="hidden" />
            <button
              onClick={() => fileInputRef.current.click()}
              disabled={uploadingResume}
              className="group flex items-center gap-2 px-5 py-2.5 bg-[#f7f7f7] hover:bg-[#ededed] text-[#111111] text-sm font-semibold rounded-full border border-[#ededed] transition-all disabled:opacity-50"
            >
              {uploadingResume ? <Loader2 className="w-4 h-4 animate-spin text-[#737373]" /> : <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />}
              {uploadingResume ? 'Processing...' : 'Re-sync Resume'}
            </button>
            <button
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

        <AnimatePresence>
          {reminders.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-[#fff9eb] border border-[#ffeeba] p-5 rounded-[20px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-[#fef3c7] rounded-full flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-[#d97706]" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-[#92400e]">Proactive Reminders</h4>
                    <p className="text-[13px] text-[#b45309]">Loomo noticed {reminders.length} applications from over a week ago. Need to follow up?</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                  {reminders.map(job => (
                    <button
                      key={job.id}
                      onClick={() => handleGenerateFollowUp(job.id)}
                      className="px-3 py-1.5 bg-white border border-[#ffeeba] hover:border-[#f59e0b] text-[#92400e] text-[12px] font-medium rounded-lg whitespace-nowrap transition-all shadow-sm"
                    >
                      Follow up: {job.company}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="border border-[#ededed] rounded-[16px] bg-white overflow-hidden shadow-sm"
        >
          <div className="px-6 py-4 border-b border-[#ededed] flex justify-between items-center text-sm font-medium text-[#111111]">
            <span>Recent Applications</span>
            <span className="text-[#737373] font-normal">{jobs.length} total</span>
          </div>

          {jobs.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <Target className="w-10 h-10 text-[#ededed] mb-4" />
              <p className="text-[#111111] font-medium text-sm">No applications tracked yet</p>
              <p className="text-[#737373] text-sm mt-1 text-balance">Click "Add Application" to start parsing jobs with AI.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#ededed]">
              <AnimatePresence>
                {jobs.map((job) => (
                  <JobRow 
                    key={job.id} 
                    job={job} 
                    onDelete={handleDeleteJob} 
                    onGenerateLetter={handleGenerateLetter}
                    isGenerating={generatingLetter}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <AnimatePresence>
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
            onParseUrl={handleParseUrl}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {generatedLetter && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-[600px] flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-[#ededed] flex justify-between items-center bg-[#fdfdfd] rounded-t-[24px]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f5f3ff] rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[#6d28d9]" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#111111]">Draft Cover Letter</h3>
                    <p className="text-[12px] text-[#737373]">Generated with Loomo AI</p>
                  </div>
                </div>
                <button onClick={() => setGeneratedLetter(null)} className="p-2 text-[#a3a3a3] hover:bg-[#f7f7f7] rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed text-[#404040]">
                {generatedLetter}
              </div>

              <div className="p-6 border-t border-[#ededed] flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 py-3 bg-[#6d28d9] hover:bg-[#5b21b6] text-white rounded-[14px] font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#6d28d9]/20"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={() => setGeneratedLetter(null)}
                  className="flex-1 py-3 border border-[#ededed] hover:bg-[#f7f7f7] text-[#111111] rounded-[14px] font-semibold text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard