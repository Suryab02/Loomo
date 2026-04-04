import { useState } from 'react'
import { motion } from 'framer-motion'
import { BrainCircuit } from 'lucide-react'
import { askAgent } from '../services/api'
import { useToast } from '../context/ToastContext'

export default function AgentChatBox() {
  const { toast } = useToast()
  const [chatQuery, setChatQuery] = useState('')
  const [chatReply, setChatReply] = useState('')
  const [chatting, setChatting] = useState(false)

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatQuery) return
    setChatting(true)
    setChatReply('')
    try {
      const res = await askAgent(chatQuery)
      setChatReply(res.data.reply)
    } catch (err) {
      const msg = err.response?.status === 429
        ? 'Too many AI requests. Wait a minute and try again.'
        : 'Could not reach the agent.'
      setChatReply(msg)
      toast(msg, 'error')
    } finally {
      setChatting(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mb-10 bg-[#f5f3ff] p-8 rounded-[20px] border border-[#ede9fe] shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <BrainCircuit className="w-5 h-5 text-[#6d28d9]" />
        <h3 className="text-[15px] font-semibold text-[#6d28d9]">Chat with Data Analyst Agent</h3>
      </div>
      <form onSubmit={handleChat} className="flex gap-3">
        <input 
          value={chatQuery} onChange={e => setChatQuery(e.target.value)}
          placeholder="Ask me: 'Mark my complete application to Google as interview' or 'Why am I getting rejected?'"
          className="flex-1 px-4 py-3 bg-white rounded-[12px] border border-[#d8b4fe] text-sm text-[#111111] outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all placeholder:text-[#a3a3a3] shadow-sm"
        />
        <button 
          type="submit" disabled={chatting || !chatQuery}
          className="px-6 py-3 bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-medium text-sm rounded-[12px] transition-colors disabled:opacity-50"
        >
          {chatting ? 'Thinking...' : 'Ask Analyst'}
        </button>
      </form>
      {chatReply && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 p-5 bg-white rounded-[12px] border border-[#e5e7eb] text-sm text-[#111111] leading-relaxed shadow-sm">
          <strong className="text-[#6d28d9]">Agent response:</strong> {chatReply}
        </motion.div>
      )}
    </motion.div>
  )
}
