import { motion } from 'framer-motion'
import { Sparkles, X, Building2, MapPin, DollarSign, Target } from 'lucide-react'

export default function AddJobModal({
  onClose,
  pasteText,
  setPasteText,
  handleParseJob,
  parsing,
  newJob,
  setNewJob,
  handleAddJob,
  adding
}) {
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
  )
}
