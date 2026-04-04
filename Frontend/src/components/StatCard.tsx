import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  index?: number;
}

export default function StatCard({ label, value, index = 0 }: StatCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.05 }}
      className="p-5 rounded-[16px] border border-[#ededed] bg-white flex flex-col gap-1 shadow-sm"
    >
      <div className="text-[#737373] text-[11px] font-semibold uppercase tracking-widest">{label}</div>
      <div className="text-3xl font-medium tracking-tight text-[#111111]">{value}</div>
    </motion.div>
  );
}
