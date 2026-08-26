export interface Job {
  id: number;
  key: string;
  name: string;
  description?: string | null;
  cron: string;
  timezone: string;
  enabled: boolean;
  params?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StepRun {
  id: number;
  stepId: string;
  type: string;
  status: string;
  input?: string | null;
  output?: string | null;
  error?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
}

export interface JobRun {
  id: number;
  jobId: number;
  status: string;
  trigger: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  error?: string | null;
  createdAt: string;
  stepRuns?: StepRun[];
}

export interface CreateJobInput {
  key: string;
  name: string;
  description?: string | null;
  cron: string;
  timezone?: string | null;
  enabled?: boolean | null;
  params?: string | null;
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  id: number;
}
