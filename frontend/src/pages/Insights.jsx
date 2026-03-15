import { useState, useEffect } from 'react'
import { getStats, getPlatforms, getKeywords } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import Navbar from '../components/Navbar'
import StatCard from '../components/StatCard'

function Insights() {
  const [stats, setStats] = useState(null)
  const [platforms, setPlatforms] = useState([])
  const [keywords, setKeywords] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading insights...</p>
      </div>
    </div>
  )

  const statCards = [
    { label: 'Total Applied', value: stats?.applied ?? 0, color: 'var(--accent)', bg: 'var(--accent-light)' },
    { label: 'Interviews', value: stats?.interview ?? 0, color: 'var(--purple)', bg: 'var(--purple-light)' },
    { label: 'Offers', value: stats?.offer ?? 0, color: 'var(--success)', bg: 'var(--success-light)' },
    { label: 'Response Rate', value: `${stats?.response_rate ?? 0}%`, color: 'var(--warning)', bg: 'var(--warning-light)' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)' }}>
            Insights
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '2px' }}>
            Analytics on your job hunt performance
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {statCards.map(card => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              color={card.color}
              bg={card.bg}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Platform chart */}
          <div style={{
            background: 'white', borderRadius: '14px', padding: '24px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>
              Applications by Platform
            </h3>
            {platforms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
                No platform data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={platforms} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'white', border: '1px solid var(--border)',
                      borderRadius: '8px', fontSize: '13px', boxShadow: 'var(--shadow)'
                    }}
                    cursor={{ fill: '#f1f5f9' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {platforms.map((_, i) => (
                      <Cell key={i} fill="#2563eb" fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Keyword gaps */}
          <div style={{
            background: 'white', borderRadius: '14px', padding: '24px',
            boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>
              Top Skill Gaps
            </h3>
            {keywords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
                Add jobs with descriptions to see skill gaps
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {keywords.map((kw, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                        {kw.skill}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {kw.count} jobs
                      </span>
                    </div>
                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '99px', background: 'var(--accent)',
                        width: `${(kw.count / keywords[0].count) * 100}%`,
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default Insights