import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Job, Stats, User, AuthResponse } from '../types';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Job', 'Stats', 'User', 'Reminder'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation<AuthResponse, any>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    // Jobs
    getJobs: builder.query<{ items: Job[]; total: number }, any>({
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
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, 'Stats'],
    }),
    patchJob: builder.mutation<Job, { id: number; data: Partial<Job> }>({
      query: ({ id, data }) => ({
        url: `/jobs/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Job', id }, { type: 'Job', id: 'LIST' }, 'Stats'],
    }),
    deleteJob: builder.mutation<void, number>({
      query: (id) => ({
        url: `/jobs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Job', id: 'LIST' }, 'Stats'],
    }),
    syncGmail: builder.mutation<any, void>({
      query: () => '/jobs/sync-gmail',
      invalidatesTags: [{ type: 'Job', id: 'LIST' }],
    }),

    // Insights
    getStats: builder.query<Stats, void>({
      query: () => '/insights/stats',
      providesTags: ['Stats'],
    }),
    getReminders: builder.query<Job[], void>({
      query: () => '/insights/reminders',
      providesTags: ['Reminder'],
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
  useLoginMutation,
  useGetMeQuery,
  useGetJobsQuery,
  useGetJobQuery,
  useAddJobMutation,
  usePatchJobMutation,
  useDeleteJobMutation,
  useSyncGmailMutation,
  useGetStatsQuery,
  useGetRemindersQuery,
  useGenerateCoverLetterMutation,
  useGenerateFollowUpMutation,
} = apiSlice;
