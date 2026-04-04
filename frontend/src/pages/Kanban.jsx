import { useState, useEffect } from 'react'
import { getJobs, updateJobStatus, deleteJob } from '../services/api'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import JobCard from '../components/JobCard'

const COLUMNS = [
  { id: 'wishlist',  label: 'Wishlist' },
  { id: 'applied',   label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer',     label: 'Offer' },
  { id: 'rejected',  label: 'Rejected' },
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
    <div className="min-h-screen flex items-center justify-center bg-white text-[#737373] text-sm">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        Loading board...
      </motion.div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Board</h1>
          <p className="text-[#737373] text-sm mt-1">Drag and drop to update application status</p>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
            {COLUMNS.map(col => (
              <div key={col.id} className="w-[280px] shrink-0 flex flex-col bg-[#f7f7f7] rounded-[16px] border border-[#ededed] p-2">
                <div className="px-3 py-2 flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold text-[#111111] uppercase tracking-wide">{col.label}</span>
                  <span className="text-[11px] font-bold bg-white text-[#737373] px-2 py-0.5 rounded-full border border-[#ededed] shadow-sm">
                    {getJobsByStatus(col.id).length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef} {...provided.droppableProps}
                      className={`min-h-[150px] rounded-[12px] p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-[#ededed]/50' : 'bg-transparent'}`}
                    >
                      {getJobsByStatus(col.id).map((job, index) => (
                        <Draggable key={job.id} draggableId={String(job.id)} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="mb-2 outline-none">
                              <JobCard job={job} onDelete={handleDelete} dragging={snapshot.isDragging} />
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