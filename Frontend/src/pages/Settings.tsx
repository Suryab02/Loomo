import { useMemo, useRef, useState } from 'react';
import { UserCircle2, Upload, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useGetMeQuery, useUploadResumeMutation } from '../store/apiSlice';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/apiError';

function Settings() {
  const { data: user, isLoading } = useGetMeQuery();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResume] = useUploadResumeMutation();
  const [uploadingResume, setUploadingResume] = useState(false);

  const skillList = useMemo(
    () =>
      (user?.skills || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 8),
    [user?.skills],
  );

  const handleResumeReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      await uploadResume(file).unwrap();
      toast('Resume processed — skills updated.', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to parse resume.'), 'error');
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-[1100px] mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-[#111111]">Settings</h1>
          <p className="text-[#737373] text-sm mt-1">Manage your profile and job-search preferences.</p>
        </header>

        <section className="bg-white rounded-[20px] border border-[#ededed] shadow-sm p-6 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-[14px] bg-[#f5f3ff] border border-[#ede9fe] flex items-center justify-center">
              <UserCircle2 className="w-5 h-5 text-[#6d28d9]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#111111]">Profile</h2>
              <p className="text-sm text-[#737373]">Your account and job-search preferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-1">Full Name</div>
              <div className="text-sm font-medium text-[#111111]">{user?.full_name || 'Not set'}</div>
            </div>
            <div className="rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-1">Email</div>
              <div className="text-sm font-medium text-[#111111]">{user?.email || 'Not set'}</div>
            </div>
            <div className="rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-1">Current Role</div>
              <div className="text-sm font-medium text-[#111111]">{user?.current_role || 'Not set'}</div>
            </div>
            <div className="rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-1">Current Company</div>
              <div className="text-sm font-medium text-[#111111]">{user?.current_company || 'Not set'}</div>
            </div>
            <div className="rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-1">Target Role</div>
              <div className="text-sm font-medium text-[#111111]">{user?.target_role || 'Not set'}</div>
            </div>
            <div className="rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-1">Target Location</div>
              <div className="text-sm font-medium text-[#111111]">{user?.target_location || 'Not set'}</div>
            </div>
          </div>

          <div className="mt-5 rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#737373] mb-3">Top Skills</div>
            {skillList.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {skillList.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-full border border-[#e9d5ff] bg-[#faf5ff] text-[12px] font-medium text-[#6d28d9]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-sm text-[#737373] mb-4">Upload your resume to extract skills.</div>
            )}

            <div className="pt-4 border-t border-[#ededed]">
              <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleResumeReupload} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingResume}
                className="group flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#f7f7f7] text-[#111111] text-sm font-semibold rounded-full border border-[#ededed] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] disabled:opacity-50"
              >
                {uploadingResume ? <Loader2 className="w-4 h-4 animate-spin text-[#737373]" /> : <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform text-[#737373]" />}
                {uploadingResume ? 'Processing...' : 'Upload new resume'}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Settings;
