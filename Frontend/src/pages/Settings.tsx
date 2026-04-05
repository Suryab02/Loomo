import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, Save, ShieldCheck, UserCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../lib/apiError';
import { useGetMeQuery, useUpdateSettingsMutation } from '../store/apiSlice';

function maskKey(value?: string | null) {
  if (!value) return 'No key saved';
  if (value.length <= 8) return 'Saved';
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function Settings() {
  const { toast } = useToast();
  const { data: user, isLoading } = useGetMeQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKey(user?.gemini_api_key || '');
  }, [user?.gemini_api_key]);

  const skillList = useMemo(
    () =>
      (user?.skills || '')
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean)
        .slice(0, 8),
    [user?.skills],
  );

  const handleSave = async () => {
    try {
      await updateSettings({ gemini_api_key: apiKey.trim() }).unwrap();
      toast(apiKey.trim() ? 'API key saved successfully.' : 'API key cleared.', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Could not save API key.'), 'error');
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
          <p className="text-[#737373] text-sm mt-1">Manage your profile and personal AI configuration.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6">
          <section className="bg-white rounded-[20px] border border-[#ededed] shadow-sm p-6">
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
                <div className="flex flex-wrap gap-2">
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
                <div className="text-sm text-[#737373]">Upload your resume to extract skills.</div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-[20px] border border-[#ededed] shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-[14px] bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#166534]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#111111]">Personal AI Key</h2>
                <p className="text-sm text-[#737373]">Use your own Gemini key for extension parsing and future AI settings.</p>
              </div>
            </div>

            <div className="mb-4 rounded-[16px] border border-[#ededed] bg-[#fafafa] p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[#111111] mb-1">
                <KeyRound className="w-4 h-4 text-[#6d28d9]" />
                Current status
              </div>
              <div className="text-sm text-[#737373]">{maskKey(user?.gemini_api_key)}</div>
            </div>

            <label className="block text-[13px] font-medium text-[#111111] mb-2">Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Gemini API key"
                className="w-full pr-12 px-4 py-3 rounded-[14px] border border-[#ededed] bg-[#f9f9f9] text-[14px] text-[#111111] outline-none focus:bg-white focus:border-[#a3a3a3]"
              />
              <button
                type="button"
                onClick={() => setShowKey((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-[#737373] hover:bg-[#f1f5f9]"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[13px] text-[#737373] mt-3 leading-relaxed">
              This key lets Loomo use your own AI quota for supported flows. You can leave it empty and keep using the shared backend setup.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-[14px] bg-[#111111] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Key
              </button>
              <button
                type="button"
                onClick={() => setApiKey('')}
                disabled={saving}
                className="px-5 py-3 rounded-[14px] border border-[#ededed] text-sm font-semibold text-[#111111] hover:bg-[#f7f7f7] disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Settings;
