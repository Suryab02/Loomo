import { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Orbit, User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useRegisterMutation } from '../store/apiSlice';
import { saveToken } from '../lib/auth';
import { getErrorMessage } from '../lib/apiError';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [register, { isLoading: loading }] = useRegisterMutation();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await register(form).unwrap();
      saveToken(res.access_token);
      navigate('/onboarding');
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col justify-center items-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px]"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 bg-[#f5f3ff] border border-[#ede9fe] rounded-[20px] flex items-center justify-center mb-6 shadow-sm"
          >
            <Orbit className="w-7 h-7 text-[#6d28d9]" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Create account</h1>
          <p className="text-[#737373] mt-2 text-[15px]">Start your Loomo-powered career journey</p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white border border-[#ededed] rounded-[24px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-[#fff1f2] border border-[#fecaca] text-[#e11d48] text-sm rounded-[14px]"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#111111] mb-2 px-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3] group-focus-within:text-[#6d28d9] transition-colors" />
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Surya Prabhas"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#f9f9f9] border border-[#efefef] rounded-[14px] text-[15px] text-[#111111] outline-none focus:bg-white focus:border-[#6d28d9] focus:ring-4 focus:ring-[#6d28d9]/5 transition-all placeholder:text-[#a3a3a3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#111111] mb-2 px-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3] group-focus-within:text-[#6d28d9] transition-colors" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#f9f9f9] border border-[#efefef] rounded-[14px] text-[15px] text-[#111111] outline-none focus:bg-white focus:border-[#6d28d9] focus:ring-4 focus:ring-[#6d28d9]/5 transition-all placeholder:text-[#a3a3a3]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#111111] mb-2 px-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a3a3a3] group-focus-within:text-[#6d28d9] transition-colors" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#f9f9f9] border border-[#efefef] rounded-[14px] text-[15px] text-[#111111] outline-none focus:bg-white focus:border-[#6d28d9] focus:ring-4 focus:ring-[#6d28d9]/5 transition-all placeholder:text-[#a3a3a3]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 bg-[#111111] hover:bg-[#222222] disabled:bg-[#ededed] text-white rounded-[14px] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-black/5"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-[14px] text-[#737373]">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#6d28d9] hover:underline decoration-2 underline-offset-4">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
