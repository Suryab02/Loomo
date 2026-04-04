import { useState, useEffect } from 'react'
import { getJobs, updateJobStatus, deleteJob } from '../services/api'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import JobCard from '../components/JobCard'

const COLUMNS = [
  { id: 'wishlist',  label: 'Wishlist',  color: '#737373', bg: '#f5f5f5' },
  { id: 'applied',   label: 'Applied',   color: '#2563eb', bg: '#eff6ff' },
  { id: 'screening', label: 'Screening', color: '#7c3aed', bg: '#f5f3ff' },
  { id: 'interview', label: 'Interview', color: '#ea580c', bg: '#fff7ed' },
  { id: 'offer',     label: 'Offer',     color: '#16a34a', bg: '#f0fdf4' },
  { id: 'rejected',  label: 'Rejected',  color: '#dc2626', bg: '#fef2f2' },
]

function Kanban() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchJobs() }, [])

  const fetchJobs = async () => {
    try {
      const res = await getJobs()
      setJobs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getJobsByStatus = (status) => jobs.filter(j => j.status === status)

  const handleDragEnd = async (result) => {
    if (!result.destination) return
    const jobId = parseInt(result.draggableId)
    const newStatus = result.destination.droppableId
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j))
    try {
      await updateJobStatus(jobId, newStatus)
    } catch {
      fetchJobs()
    }
  }

  const handleDelete = async (jobId) => {
    try {
      await deleteJob(jobId)
      setJobs(prev => prev.filter(j => j.id !== jobId))
    } catch (err) {
      console.error(err)
    }
  }

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
          onClick={fetchJobs}
          className="mt-6 text-[10px] font-bold text-[#111111] underline underline-offset-4 hover:text-[#737373] transition-colors"
        >
          Taking too long? Sync data
        </button>
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="p-8 max-w-[1100px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Board</h1>
          <p className="text-[#737373] text-sm mt-1">Drag and drop to update application status</p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
            {COLUMNS.map(col => (
              <div key={col.id} className="w-[300px] shrink-0 flex flex-col bg-[#fafafa] rounded-[24px] border border-[#ededed] p-2 min-h-[70vh]">
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
                      ref={provided.innerRef} {...provided.droppableProps}
                      className={`flex-1 rounded-[18px] p-2 transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-[#f0f0f0]' : 'bg-transparent'}`}
                    >
                      {getJobsByStatus(col.id).map((job, index) => (
                        <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
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
  )
}

export default Kanban