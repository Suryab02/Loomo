import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Orbit, Upload, CheckCircle2 } from 'lucide-react';
import { uploadResume, savePreferences } from '../services/api';

interface ResumeData {
  current_role?: string;
  current_company?: string;
  skills?: string;
  [key: string]: any;
}

interface Preferences {
  target_role: string;
  work_type: string;
  target_location: string;
  expected_ctc: string;
  notice_period: string;
  platforms: string;
  [key: string]: string;
}

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [prefs, setPrefs] = useState<Preferences>({
    target_role: '', work_type: 'remote', target_location: '',
    expected_ctc: '', notice_period: '', platforms: ''
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadResume = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const res = await uploadResume(file);
      setResumeData(res.data);
      setStep(2);
    } catch {
      setError('Failed to parse resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefsChange = (e: ChangeEvent<HTMLInputElement>) => setPrefs({ ...prefs, [e.target.name]: e.target.value });

  const handleSavePrefs = async () => {
    setLoading(true);
    setError('');
    try {
      await savePreferences(prefs);
      setStep(3);
    } catch {
      setError('Failed to save preferences.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-6">
      <div className="w-full max-w-[500px]">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-[16px] bg-[#f5f3ff] border border-[#ede9fe] flex items-center justify-center mb-4">
            <Orbit className="w-6 h-6 text-[#6d28d9]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">Setup Loomo</h1>
          <p className="text-[#737373] text-[15px] mt-1">Let's configure your AI agent</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-sm border border-[#ededed] p-8 md:p-10"
        >
          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-[#6d28d9]' : 'bg-[#f7f7f7]'}`} />
            ))}
          </div>

          <p className="text-[11px] font-bold text-[#6d28d9] uppercase tracking-widest mb-3">Step {step} of 3</p>

          {error && (
            <div className="mb-6 p-4 rounded-[12px] bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] text-[14px]">
              {error}
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-semibold text-[#111111] mb-1">Upload your resume</h2>
              <p className="text-[#737373] text-[14px] mb-6">We'll automatically extract your baseline skills.</p>

              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="resume" />
              <label 
                htmlFor="resume" 
                className={`block border-2 border-dashed rounded-[16px] p-10 text-center cursor-pointer mb-6 transition-all ${file ? 'border-[#6d28d9] bg-[#f5f3ff]' : 'border-[#ededed] hover:border-[#a3a3a3]'}`}
              >
                <div className="flex justify-center mb-3">
                  {file ? <CheckCircle2 className="w-8 h-8 text-[#6d28d9]" /> : <Upload className="w-8 h-8 text-[#a3a3a3]" />}
                </div>
                <p className={`text-[14px] font-medium ${file ? 'text-[#6d28d9]' : 'text-[#737373]'}`}>
                  {file ? file.name : 'Click to select your PDF resume'}
                </p>
              </label>

              <button
                onClick={handleUploadResume} disabled={!file || loading}
                className="w-full py-3 rounded-[12px] bg-[#6d28d9] disabled:bg-[#ededed] disabled:text-[#a3a3a3] text-white font-medium text-[15px] transition-all hover:bg-[#5b21b6]"
              >
                {loading ? 'Analyzing with AI...' : 'Continue'}
              </button>
            </motion.div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-xl font-semibold text-[#111111] mb-1">Target Preferences</h2>
              <p className="text-[#737373] text-[14px] mb-6">What kind of roles are you looking for?</p>

              {resumeData && (
                <div className="mb-6 p-4 bg-[#f5f3ff] border border-[#ede9fe] rounded-[16px]">
                  <p className="text-[11px] font-bold text-[#6d28d9] uppercase tracking-widest mb-2">Extracted Data</p>
                  {[
                    { label: 'Role', value: resumeData.current_role },
                    { label: 'Company', value: resumeData.current_company },
                    { label: 'Skills', value: resumeData.skills },
                  ].map(item => item.value && (
                    <div key={item.label} className="text-[13px] text-[#111111] mb-1">
                      <span className="text-[#737373]">{item.label}:</span> {item.value}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-4 mb-6">
                {[
                  { label: 'Target Role', name: 'target_role', ph: 'Backend Engineer' },
                  { label: 'Location', name: 'target_location', ph: 'Remote' },
                  { label: 'Expected Salary', name: 'expected_ctc', ph: '$120,000' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-[13px] font-medium text-[#111111] mb-1.5">{field.label}</label>
                    <input
                      type="text" name={field.name} value={prefs[field.name]} onChange={handlePrefsChange} placeholder={field.ph}
                      className="w-full px-4 py-3 rounded-[12px] border border-[#ededed] bg-[#f7f7f7] text-[14px] text-[#111111] outline-none focus:bg-white focus:border-[#a3a3a3] transition-colors"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSavePrefs} disabled={loading}
                className="w-full py-3 rounded-[12px] bg-[#6d28d9] disabled:bg-[#ededed] disabled:text-[#a3a3a3] text-white font-medium text-[15px] transition-all hover:bg-[#5b21b6]"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </motion.div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#f0fdf4] text-[#16a34a] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-[#111111] mb-2">You're all set!</h2>
              <p className="text-[#737373] text-[15px] mb-8">Your AI Career Analyst is ready to work.</p>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 rounded-[12px] bg-[#111111] text-white font-medium text-[15px] transition-all hover:bg-[#333333]"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default Onboarding;
