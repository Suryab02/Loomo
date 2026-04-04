import { motion } from 'framer-motion'
import { Sparkles, X, Building2, MapPin, DollarSign, Target, Link, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'

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
  onParseUrl
}) {
  const [activeTab, setActiveTab] = useState('text') // 'text' or 'url'
  const [url, setUrl] = useState('')
  const [loadingUrl, setLoadingUrl] = useState(false)

  const handleUrlParse = async () => {
    if (!url) return;
    setLoadingUrl(true);
    try {
      await onParseUrl(url);
      setUrl('');
      setActiveTab('text'); // Switch back to see result or just stay
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUrl(false);
    }
  }
  return (
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
          <button onClick={onClose} className="text-[#a3a3a3] hover:text-[#111111] p-1 bg-[#f7f7f7] rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smart Paste / URL Toggle */}
        <div className="mb-6 bg-[#f7f7f7] p-4 rounded-[20px] border border-[#ededed]">
          <div className="flex p-1 bg-white rounded-full border border-[#ededed] mb-4">
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-semibold rounded-full transition-all ${activeTab === 'text' ? 'bg-[#111111] text-white' : 'text-[#737373] hover:bg-[#f7f7f7]'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Job Description
            </button>
            <button 
              onClick={() => setActiveTab('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[12px] font-semibold rounded-full transition-all ${activeTab === 'url' ? 'bg-[#111111] text-white' : 'text-[#737373] hover:bg-[#f7f7f7]'}`}
            >
              <Link className="w-3.5 h-3.5" />
              Job Link
            </button>
          </div>

          {activeTab === 'text' ? (
            <>
              <textarea
                placeholder="Paste the raw job description here..."
                value={pasteText} onChange={e => setPasteText(e.target.value)} rows={3}
                className="w-full p-3 rounded-[14px] border border-[#ededed] bg-white text-[13px] outline-none text-[#111111] resize-none mb-3 placeholder:text-[#a3a3a3] focus:border-[#a3a3a3] transition-colors"
              />
              <button
                onClick={handleParseJob} disabled={parsing || !pasteText}
                className="w-full py-3 rounded-[14px] bg-[#111111] disabled:bg-[#f5f5f5] disabled:text-[#a3a3a3] text-white font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {parsing ? 'Extracting...' : 'Extract Details'}
              </button>
            </>
          ) : (
            <>
              <input
                type="url"
                placeholder="https://www.linkedin.com/jobs/view/..."
                value={url} onChange={e => setUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-[14px] border border-[#ededed] bg-white text-[13px] outline-none text-[#111111] mb-3 placeholder:text-[#a3a3a3] focus:border-[#a3a3a3] transition-colors"
              />
              <button
                onClick={handleUrlParse} disabled={loadingUrl || !url}
                className="w-full py-3 rounded-[14px] bg-[#111111] disabled:bg-[#f5f5f5] disabled:text-[#a3a3a3] text-white font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                {loadingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                {loadingUrl ? 'Scraping Link...' : 'Clip Job from Link'}
              </button>
            </>
          )}
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
  )
}
