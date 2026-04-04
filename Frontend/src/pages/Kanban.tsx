import { useState, useEffect, useMemo } from 'react';
import { getJobs, updateJobStatus, deleteJob } from '../services/api';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Loader2, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';
import { Job, JobStatus } from '../types';

interface Column {
  id: JobStatus;
  label: string;
  color: string;
  bg: string;
}

const COLUMNS: Column[] = [
  { id: 'wishlist',  label: 'Wishlist',  color: '#737373', bg: '#f5f5f5' },
  { id: 'applied',   label: 'Applied',   color: '#2563eb', bg: '#eff6ff' },
  { id: 'screening', label: 'Screening', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'interview', label: 'Interview', color: '#ea580c', bg: '#fff7ed' },
  { id: 'offer',     label: 'Offer',     color: '#16a34a', bg: '#f0fdf4' },
  { id: 'rejected',  label: 'Rejected',  color: '#dc2626', bg: '#fef2f2' },
];

function Kanban() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterQ, setFilterQ] = useState('');

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      const res = await getJobs({ per_page: 500, sort: 'created_at', order: 'desc' });
      const jd = res.data;
      setJobs(Array.isArray(jd) ? jd : (jd.items || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    const q = filterQ.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        (j.company || '').toLowerCase().includes(q) ||
        (j.role || '').toLowerCase().includes(q),
    );
  }, [jobs, filterQ]);

  const getJobsByStatus = (status: JobStatus) => filteredJobs.filter((j) => j.status === status);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const jobId = parseInt(result.draggableId, 10);
    const newStatus = result.destination.droppableId as JobStatus;
    
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    
    try {
      await updateJobStatus(jobId, newStatus);
    } catch {
      fetchJobs();
    }
  };

  const handleDelete = async (jobId: number) => {
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center"
      >
        <div className="w-12 h-12 bg-[#111111] rounded-[18px] flex items-center justify-center mb-4 shadow-lg">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <h2 className="text-sm font-bold text-[#111111] mb-1">Organizing your board...</h2>

        <button
          type="button"
          onClick={fetchJobs}
          className="mt-6 text-[10px] font-bold text-[#111111] underline underline-offset-4 hover:text-[#737373] transition-colors"
        >
          Taking too long? Sync data
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Board</h1>
            <p className="text-[#737373] text-sm mt-1">Drag and drop to update application status · scroll horizontally on small screens</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
            <input
              value={filterQ}
              onChange={(e) => setFilterQ(e.target.value)}
              placeholder="Filter cards by company or role..."
              className="w-full pl-9 pr-3 py-2.5 rounded-[12px] border border-[#ededed] text-sm outline-none focus:border-[#a3a3a3]"
            />
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none snap-x snap-mandatory md:snap-none">
            {COLUMNS.map((col) => (
              <div
                key={col.id}
                className="w-[min(100vw-2rem,300px)] shrink-0 snap-center flex flex-col bg-[#fafafa] rounded-[24px] border border-[#ededed] p-2 min-h-[70vh]"
              >
                <div className="px-4 py-3 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ backgroundColor: col.color }} className="w-1.5 h-1.5 rounded-full" />
                    <span className="text-[13px] font-bold text-[#111111] tracking-tight">{col.label}</span>
                  </div>
                  <span className="text-[11px] font-bold bg-white text-[#737373] px-2.5 py-1 rounded-full border border-[#ededed] shadow-sm">
                    {getJobsByStatus(col.id).length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-[18px] p-2 transition-all duration-200 min-h-[120px] ${snapshot.isDraggingOver ? 'bg-[#f0f0f0]' : 'bg-transparent'}`}
                    >
                      {getJobsByStatus(col.id).map((job, index) => (
                        <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="mb-3 outline-none"
                            >
                              <JobCard
                                job={job}
                                onDelete={handleDelete}
                                dragging={snapshot.isDragging}
                                accentColor={col.color}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}

export default Kanban;
