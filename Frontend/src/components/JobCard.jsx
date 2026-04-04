import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

function JobCard({ job, onDelete, dragging = false, accentColor = '#ededed' }) {
  return (
    <div 
      className={`group relative bg-white rounded-[20px] p-5 text-left transition-all ${
        dragging ? 'shadow-2xl border-[#111111] border-2 scale-105 z-50' : 'border border-[#ededed] shadow-sm hover:shadow-md hover:border-[#d4d4d4]'
      }`}
    >
      <div 
        style={{ backgroundColor: accentColor }} 
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px] opacity-70"
      />

      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col">
          <p className="font-bold text-[#111111] text-[14px] leading-tight mb-1">{job.company}</p>
          <p className="text-[#737373] text-[12px] font-medium uppercase tracking-wider">{job.role}</p>
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(job.id)}
            className="p-1.5 text-[#a3a3a3] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-full transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f7f7f7]">
        {job.match_score ? (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            job.match_score >= 70 ? 'bg-[#f0fdf4] text-[#059669]' : 
            job.match_score >= 40 ? 'bg-[#fffbeb] text-[#d97706]' : 'bg-[#fef2f2] text-[#dc2626]'
          }`}>
            {job.match_score}% MATCH
          </div>
        ) : <div />}
        
        <div className="text-[10px] text-[#a3a3a3] font-medium italic">
          {job.platform || 'General'}
        </div>
      </div>
    </div>
  )
}

export default JobCard