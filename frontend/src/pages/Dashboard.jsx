import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, Target } from 'lucide-react'
import { getStats, getJobs, addJob, parseJobText, uploadResume, deleteJob } from '../services/api'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'
import JobRow from '../components/JobRow'
import AddJobModal from '../components/AddJobModal'

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [jobs, setJobs] = useState([])
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

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([getStats(), getJobs()])
      setStats(statsRes.data)
      setJobs(jobsRes.data)
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-[#737373] text-sm">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        Loading your workspace...
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
              className="flex items-center gap-2 px-4 py-2 bg-[#f7f7f7] hover:bg-[#ededed] text-[#111111] text-sm font-medium rounded-full transition-colors"
            >
              <Upload className="w-4 h-4" />
              {uploadingResume ? 'Parsing...' : 'Re-sync Resume'}
            </button>
            <button
              onClick={() => setShowAddJob(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#333333] text-white text-sm font-medium rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Application
            </button>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((card, i) => (
            <StatCard key={card.label} label={card.label} value={card.value} index={i} />
          ))}
        </div>

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
                  <JobRow key={job.id} job={job} onDelete={handleDeleteJob} />
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
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard