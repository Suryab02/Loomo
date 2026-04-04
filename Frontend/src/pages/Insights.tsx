import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getStats, getPlatforms, getKeywords } from '../services/api';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import AgentChatBox from '../components/AgentChatBox';
import { InsightsSkeleton } from '../components/PageSkeleton';
import { Stats } from '../types';

interface PlatformData {
  name: string;
  count: number;
}

interface KeywordGap {
  skill: string;
  count: number;
}

function Insights() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [platforms, setPlatforms] = useState<PlatformData[]>([]);
  const [keywords, setKeywords] = useState<KeywordGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [statsRes, platformsRes, keywordsRes] = await Promise.all([
        getStats(), getPlatforms(), getKeywords(),
      ]);
      setStats(statsRes.data);
      setPlatforms(Object.entries(platformsRes.data as Record<string, number>).map(([name, count]) => ({ name, count })));
      setKeywords(keywordsRes.data.keyword_gaps || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <InsightsSkeleton />;

  const statCards = [
    { label: 'Wishlist', value: stats?.wishlist ?? 0 },
    { label: 'Applied', value: stats?.applied ?? 0 },
    { label: 'Wishlist → Applied', value: `${stats?.wishlist_to_applied_rate ?? 0}%` },
    { label: 'Response Rate', value: `${stats?.response_rate ?? 0}%` },
    { label: 'Interviews', value: stats?.interview ?? 0 },
    { label: 'Offers', value: stats?.offer ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Insights</h1>
          <p className="text-[#737373] text-sm mt-1">Pipeline health, platforms, and skill gaps</p>
        </div>

        <AgentChatBox />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {statCards.map((card, i) => (
            <StatCard key={card.label} label={card.label} value={card.value} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        animate={{ width: `${keywords[0]?.count ? (kw.count / keywords[0].count) * 100 : 0}%` }}
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
  );
}

export default Insights;
