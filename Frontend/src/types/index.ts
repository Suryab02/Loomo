export type JobStatus = 'wishlist' | 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export interface Job {
  id: number;
  user_id: number;
  company: string;
  role: string;
  job_description?: string;
  status: JobStatus;
  platform?: string;
  location?: string;
  salary_range?: string;
  job_url?: string;
  applied_date?: string;
  match_score?: number;
  missing_skills?: string;
  resume_version?: string;
  follow_up_contacted: boolean;
  follow_up_snooze_until?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  skills?: string;
  target_role?: string;
  preferences?: Record<string, any>;
  llm_budget?: number;
}

export interface Stats {
  total: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  wishlist: number;
  screening: number;
  response_rate: number;
  wishlist_to_applied_rate: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
