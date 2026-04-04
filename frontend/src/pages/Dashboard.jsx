import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Upload, Trash2, Sparkles, X, Building2, MapPin, DollarSign, Target } from 'lucide-react'
import { getStats, getJobs, addJob, parseJobText, uploadResume, deleteJob } from '../services/api'
import Navbar from '../components/Navbar'

function Dashboard() {
  const navigate = useNavigate()
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
    company: '', role: '', job_description: '',
    platform: '', location: '', salary_range: ''
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
        {/* Header Section */}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((card, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              key={card.label} 
              className="p-5 rounded-[16px] border border-[#ededed] bg-white flex flex-col gap-1 shadow-sm"
            >
              <div className="text-[#737373] text-[11px] font-semibold uppercase tracking-widest">{card.label}</div>
              <div className="text-3xl font-medium tracking-tight text-[#111111]">{card.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Jobs List */}
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
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, height: 0 }}
                    key={job.id} 
                    className="p-5 flex items-center justify-between group hover:bg-[#f7f7f7]/50 transition-colors"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-[12px] bg-[#f7f7f7] border border-[#ededed] flex items-center justify-center font-semibold text-[#111111] text-lg">
                        {job.company[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-[#111111] text-[15px]">{job.company}</div>
                        <div className="text-[#737373] text-[13px] mt-0.5">{job.role} {job.platform && `· ${job.platform}`}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {job.match_score && (
                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          job.match_score >= 70 ? 'bg-[#f0fdf4] text-[#059669]' : 
                          job.match_score >= 40 ? 'bg-[#fffbeb] text-[#d97706]' : 'bg-[#fef2f2] text-[#dc2626]'
                        }`}>
                          {job.match_score}% Match
                        </div>
                      )}
                      
                      <div className="px-3 py-1 rounded-full text-[12px] font-medium capitalize bg-[#f7f7f7] text-[#111111] border border-[#ededed]">
                        {job.status}
                      </div>

                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-1.5 text-[#a3a3a3] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-md transition-all opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      {/* Add Job Modal */}
      <AnimatePresence>
        {showAddJob && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[20px] p-7 w-full max-w-[500px] shadow-2xl border border-[#ededed]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-[#111111]">New Application</h3>
                <button onClick={() => setShowAddJob(false)} className="text-[#a3a3a3] hover:text-[#111111] p-1 bg-[#f7f7f7] rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Smart Paste */}
              <div className="mb-6 bg-[#f7f7f7] p-5 rounded-[16px] border border-[#ededed]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#111111]" />
                  <span className="text-[13px] font-semibold text-[#111111]">AI Smart Paste</span>
                </div>
                <textarea
                  placeholder="Paste the raw job description here... we'll do the rest."
                  value={pasteText} onChange={e => setPasteText(e.target.value)} rows={3}
                  className="w-full p-3 rounded-[12px] border border-[#ededed] bg-white text-[13px] outline-none text-[#111111] resize-none mb-3 placeholder:text-[#a3a3a3] focus:border-[#a3a3a3] transition-colors"
                />
                <button
                  onClick={handleParseJob} disabled={parsing || !pasteText}
                  className="w-full py-2.5 rounded-[12px] bg-[#111111] disabled:bg-[#ededed] disabled:text-[#a3a3a3] text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                  {parsing ? 'Extracting with Gemini...' : 'Extract Details'}
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { name: 'company', icon: Building2, ph: 'Company' },
                  { name: 'role', icon: Target, ph: 'Role' },
                  { name: 'location', icon: MapPin, ph: 'Location' },
                  { name: 'salary_range', icon: DollarSign, ph: 'Salary' },
                ].map(field => (
                  <div key={field.name} className="relative">
                    <field.icon className="w-4 h-4 absolute left-3 top-3 text-[#a3a3a3]" />
                    <input
                      placeholder={field.ph} value={newJob[field.name]}
                      onChange={e => setNewJob({ ...newJob, [field.name]: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm text-[#111111] outline-none focus:border-[#a3a3a3] transition-colors placeholder:text-[#a3a3a3]"
                    />
                  </div>
                ))}
              </div>

              <textarea
                placeholder="Paste full job description for automated match scoring (optional)"
                value={newJob.job_description} onChange={e => setNewJob({ ...newJob, job_description: e.target.value })} rows={2}
                className="w-full p-3 rounded-[12px] border border-[#ededed] text-sm text-[#111111] outline-none resize-none mb-6 focus:border-[#a3a3a3] transition-colors placeholder:text-[#a3a3a3]"
              />

              <button
                onClick={handleAddJob} disabled={adding || !newJob.company || !newJob.role}
                className="w-full py-3 rounded-[12px] bg-[#111111] disabled:bg-[#f7f7f7] disabled:text-[#a3a3a3] text-white font-semibold text-sm transition-all hover:bg-[#333333]"
              >
                {adding ? 'Saving...' : 'Save Application'}
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Dashboard