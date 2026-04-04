import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'

function JobCard({ job, onDelete, dragging = false }) {
  return (
    <div 
      className={`group relative bg-white rounded-[12px] p-4 text-left transition-all ${
        dragging ? 'shadow-2xl border-[#111111] border-2 scale-105 z-50' : 'border border-[#ededed] shadow-sm hover:shadow hover:border-[#d4d4d4]'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#f7f7f7] border border-[#ededed] flex items-center justify-center font-bold text-[#111111] text-xs">
          {job.company[0]?.toUpperCase()}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(job.id)}
            className="p-1.5 text-[#a3a3a3] hover:text-[#dc2626] hover:bg-[#fef2f2] rounded-md transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="font-semibold text-[#111111] text-[13px] leading-tight mb-0.5">{job.company}</p>
      <p className="text-[#737373] text-[12px]">{job.role}</p>

      {job.match_score && (
        <div className={`mt-3 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          job.match_score >= 70 ? 'bg-[#f0fdf4] text-[#059669]' : 
          job.match_score >= 40 ? 'bg-[#fffbeb] text-[#d97706]' : 'bg-[#fef2f2] text-[#dc2626]'
        }`}>
          {job.match_score}% Match
        </div>
      )}
    </div>
  )
}

export default JobCard