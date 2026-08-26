import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_JOBS, RUN_JOB, REMOVE_JOB } from '../graphql';
import type { Job } from '../types';
import JobRuns from './JobRuns';

interface Props {
  onEdit: (id: number) => void;
}

export default function JobList({ onEdit }: Props) {
  const { data, loading, error, refetch } = useQuery<{ jobs: Job[] }>(GET_JOBS);
  const [runJob] = useMutation(RUN_JOB);
  const [removeJob] = useMutation(REMOVE_JOB);
  const [runsJobId, setRunsJobId] = useState<number | null>(null);

  const handleRun = async (id: number) => {
    try {
      await runJob({ variables: { id } });
    } catch (e) {
      alert(`Failed to run job: ${e instanceof Error ? e.message : e}`);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm('Remove this job?')) return;
    try {
      await removeJob({ variables: { id } });
      await refetch();
    } catch (e) {
      alert(`Failed to remove job: ${e instanceof Error ? e.message : e}`);
    }
  };

  if (loading) return <div className="loading">Loading jobs…</div>;
  if (error) return <div className="error-banner">Error: {error.message}</div>;

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Key</th>
            <th>Name</th>
            <th>Cron</th>
            <th>Timezone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.jobs?.map((job) => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td className="mono">{job.key}</td>
              <td>
                {job.name}
                {job.description ? (
                  <div style={{ color: '#57606a', fontSize: 12 }}>
                    {job.description}
                  </div>
                ) : null}
              </td>
              <td className="mono">{job.cron}</td>
              <td>{job.timezone}</td>
              <td>
                <span className={`badge ${job.enabled ? 'enabled' : 'disabled'}`}>
                  {job.enabled ? 'enabled' : 'disabled'}
                </span>
              </td>
              <td>
                <div className="actions">
                  <button className="btn" onClick={() => onEdit(job.id)}>
                    Edit
                  </button>
                  <button className="btn" onClick={() => setRunsJobId(job.id)}>
                    Runs
                  </button>
                  <button className="btn btn-primary" onClick={() => handleRun(job.id)}>
                    Run
                  </button>
                  <button className="btn btn-danger" onClick={() => handleRemove(job.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!data?.jobs?.length ? (
            <tr>
              <td colSpan={7} className="empty">
                No jobs yet. Create one!
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {runsJobId !== null ? (
        <JobRuns jobId={runsJobId} onClose={() => setRunsJobId(null)} />
      ) : null}
    </div>
  );
}
