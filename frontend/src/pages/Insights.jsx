import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts'
import { BrainCircuit } from 'lucide-react'
import { getStats, getPlatforms, getKeywords, askAgent } from '../services/api'
import Navbar from '../components/Navbar'

function Insights() {
  const [stats, setStats] = useState(null)
  const [platforms, setPlatforms] = useState([])
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)
  const [chatQuery, setChatQuery] = useState('')
  const [chatReply, setChatReply] = useState('')
  const [chatting, setChatting] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [statsRes, platformsRes, keywordsRes] = await Promise.all([
        getStats(), getPlatforms(), getKeywords()
      ])
      setStats(statsRes.data)
      setPlatforms(Object.entries(platformsRes.data).map(([name, count]) => ({ name, count })))
      setKeywords(keywordsRes.data.keyword_gaps)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatQuery) return;
    setChatting(true);
    setChatReply('');
    try {
      const res = await askAgent(chatQuery);
      setChatReply(res.data.reply);
    } catch(err) {
      setChatReply("Error communicating with Agent.");
    } finally {
      setChatting(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white text-[#737373] text-sm">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        Loading insights...
      </motion.div>
    </div>
  )

  const statCards = [
    { label: 'Total Applied', value: stats?.applied ?? 0 },
    { label: 'Interviews', value: stats?.interview ?? 0 },
    { label: 'Offers', value: stats?.offer ?? 0 },
    { label: 'Response Rate', value: `${stats?.response_rate ?? 0}%` },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Insights</h1>
          <p className="text-[#737373] text-sm mt-1">Analytics on your job hunt performance</p>
        </div>

        {/* Agentic Chat Box */}
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
              placeholder="Ask me: 'Why am I getting rejected?' or 'How many jobs did I apply to?'"
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

        {/* Stat Cards */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Platform chart */}
          <div className="bg-white rounded-[16px] p-6 border border-[#ededed] shadow-sm">
            <h3 className="text-[15px] font-semibold text-[#111111] mb-8">Applications by Platform</h3>
            {platforms.length === 0 ? (
              <div className="text-center py-10 text-[#a3a3a3] text-sm tracking-wide">No platform data yet</div>
            ) : (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platforms} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                    <Tooltip cursor={{ fill: '#f7f7f7' }} contentStyle={{ borderRadius: '8px', border: '1px solid #ededed', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#111111" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Keyword Gaps */}
          <div className="bg-white rounded-[16px] p-6 border border-[#ededed] shadow-sm">
            <h3 className="text-[15px] font-semibold text-[#111111] mb-6">Top Skill Gaps</h3>
            {keywords.length === 0 ? (
              <div className="text-center py-10 text-[#a3a3a3] text-sm tracking-wide">Add jobs with descriptions to see skill gaps</div>
            ) : (
              <div className="flex flex-col gap-5">
                {keywords.map((kw, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <span className="text-[13px] font-medium text-[#111111]">{kw.skill}</span>
                      <span className="text-[12px] text-[#737373]">{kw.count} missed jobs</span>
                    </div>
                    <div className="h-[5px] bg-[#f7f7f7] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(kw.count / keywords[0].count) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                        className="h-full bg-[#111111] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Insights