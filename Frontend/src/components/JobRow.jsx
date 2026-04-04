import { motion } from 'framer-motion'
import { Trash2, FileText, Loader2 } from 'lucide-react'

export default function JobRow({ job, onDelete, onGenerateLetter, isGenerating, onOpen }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, height: 0 }}
      className="p-5 flex items-center justify-between group hover:bg-[#f7f7f7]/50 transition-colors cursor-pointer"
      onClick={() => onOpen?.(job)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen?.(job) } }}
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
          onClick={(e) => { e.stopPropagation(); onGenerateLetter(job.id) }}
          disabled={isGenerating}
          className="p-1.5 text-[#a3a3a3] hover:text-[#6d28d9] hover:bg-[#f5f3ff] rounded-md transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
          title="Draft Cover Letter"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onDelete(job.id) }}
          className="p-1.5 text-[#a3a3a3] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-md transition-all opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
