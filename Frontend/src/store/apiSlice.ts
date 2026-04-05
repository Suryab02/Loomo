import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, Job, KeywordGap, ParseJobResult, Stats, User } from '../types';
import { clearSession, getToken } from '../lib/auth';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);
    if (result.error?.status === 401) {
      clearSession();
    }
    return result;
  },
  tagTypes: ['Job', 'Stats', 'User', 'Reminder'],
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, { email: string; password: string; full_name: string }>({
      query: (body) => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    login: builder.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    updateSettings: builder.mutation<{ ok: boolean }, { gemini_api_key: string }>({
      query: (body) => ({
        url: '/auth/settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    uploadResume: builder.mutation<Record<string, unknown>, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return {
          url: '/onboarding/upload-resume',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['User'],
    }),
    savePreferences: builder.mutation<
      { message: string },
      {
        target_role: string;
        work_type: string;
        target_location: string;
        expected_ctc: string;
        notice_period: string;
        platforms: string;
      }
    >({
      query: (body) => ({
        url: '/onboarding/preferences',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    getJobs: builder.query<{ items: Job[]; total: number; page: number; per_page: number }, Record<string, unknown> | void>({
      query: (params) => ({
        url: '/jobs/',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Job' as const, id })),
              { type: 'Job', id: 'LIST' },
            ]
          : [{ type: 'Job', id: 'LIST' }],
    }),
    getJob: builder.query<Job, number>({
      query: (id) => `/jobs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Job', id }],
    }),
    addJob: builder.mutation<Job, Partial<Job>>({
      query: (body) => ({
        url: '/jobs/',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, 'Stats', 'Reminder'],
    }),
    patchJob: builder.mutation<Job, { id: number; data: Partial<Job> & { recalculate_match?: boolean } }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Job', id }, { type: 'Job', id: 'LIST' }, 'Stats', 'Reminder'],
    }),
    deleteJob: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, 'Stats', 'Reminder'],
    }),
    parseJobText: builder.mutation<ParseJobResult, { text: string }>({
      query: (body) => ({
        url: '/jobs/parse-text',
        method: 'POST',
        body,
      }),
    }),
    parseJobUrl: builder.mutation<ParseJobResult, { url: string }>({
      query: (body) => ({
        url: '/jobs/parse-url',
        method: 'POST',
        body,
      }),
    }),
    updateJobStatus: builder.mutation<Job, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/jobs/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Job', id }, { type: 'Job', id: 'LIST' }, 'Stats', 'Reminder'],
    }),
    syncGmail: builder.mutation<{ jobs_found: ParseJobResult[] }, void>({
      query: () => ({
        url: '/jobs/sync-gmail',
        method: 'GET',
      }),
    }),
    snoozeReminder: builder.mutation<Job, { id: number; days?: number }>({
      query: ({ id, days = 7 }) => ({
        url: `/jobs/${id}/reminder-snooze`,
        method: 'POST',
        body: { days },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Job', id }, 'Reminder'],
    }),
    markReminderContacted: builder.mutation<Job, number>({
      query: (id) => ({
        url: `/jobs/${id}/reminder-contacted`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'Job', id }, 'Reminder'],
    }),

    getStats: builder.query<Stats, void>({
      query: () => '/insights/stats',
      providesTags: ['Stats'],
    }),
    getReminders: builder.query<Job[], void>({
      query: () => '/insights/reminders',
      providesTags: ['Reminder'],
    }),
    getPlatforms: builder.query<Record<string, number>, void>({
      query: () => '/insights/platforms',
    }),
    getKeywords: builder.query<{ keyword_gaps: KeywordGap[] }, void>({
      query: () => '/insights/keywords',
    }),
    askAgent: builder.mutation<{ reply: string }, string>({
      query: (query) => ({
        url: '/insights/chat',
        method: 'POST',
        body: { query },
      }),
    }),
    generateCoverLetter: builder.mutation<{ cover_letter: string }, number>({
      query: (id) => ({
        url: `/insights/cover-letter/${id}`,
        method: 'POST',
      }),
    }),
    generateFollowUp: builder.mutation<{ follow_up_email: string }, number>({
      query: (id) => ({
        url: `/insights/follow-up-email/${id}`,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useUpdateSettingsMutation,
  useUploadResumeMutation,
  useSavePreferencesMutation,
  useGetJobsQuery,
  useGetJobQuery,
  useAddJobMutation,
  usePatchJobMutation,
  useDeleteJobMutation,
  useParseJobTextMutation,
  useParseJobUrlMutation,
  useUpdateJobStatusMutation,
  useSyncGmailMutation,
  useSnoozeReminderMutation,
  useMarkReminderContactedMutation,
  useGetStatsQuery,
  useGetRemindersQuery,
  useGetPlatformsQuery,
  useGetKeywordsQuery,
  useAskAgentMutation,
  useGenerateCoverLetterMutation,
  useGenerateFollowUpMutation,
} = apiSlice;
