import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_RUNS } from '../graphql';
import type { JobRun, StepRun } from '../types';

const STATUS_CLASS: Record<string, string> = {
  success: 'success',
  running: 'running',
  failed: 'failed',
  pending: 'pending',
  skipped: 'skipped',
  timeout: 'failed',
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatDuration(startedAt?: string | null, finishedAt?: string | null): string {
  if (!startedAt || !finishedAt) return '—';
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return '—';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
}

export default function History() {
  const { data, loading, error, refetch } = useQuery<{ allRuns: JobRun[] }>(GET_ALL_RUNS);
  const [expandedRunId, setExpandedRunId] = useState<number | null>(null);

  if (loading) return <div className="loading">Loading history…</div>;
  if (error) return <div className="error-banner">Error: {error.message}</div>;

  const runs: JobRun[] = data?.allRuns || [];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Run history</h2>
        <button className="btn" onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="empty">No runs yet. Run a job to see history here.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Job</th>
              <th>When</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Trigger</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <RunRow
                key={run.id}
                run={run}
                expanded={expandedRunId === run.id}
                onToggle={() =>
                  setExpandedRunId((cur) => (cur === run.id ? null : run.id))
                }
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RunRow({
  run,
  expanded,
  onToggle,
}: {
  run: JobRun;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr>
        <td className="mono">#{run.id}</td>
        <td>
          {run.job ? (
            <>
              <strong>{run.job.name}</strong>
              <div style={{ color: '#57606a', fontSize: 12 }} className="mono">
                {run.job.key}
              </div>
            </>
          ) : (
            <span className="mono">job #{run.jobId}</span>
          )}
        </td>
        <td className="mono">{formatDate(run.startedAt || run.createdAt)}</td>
        <td>
          <span className={`badge ${STATUS_CLASS[run.status] || 'pending'}`}>
            {run.status}
          </span>
        </td>
        <td className="mono">
          {formatDuration(run.startedAt, run.finishedAt)}
        </td>
        <td className="mono">{run.trigger}</td>
        <td>
          <button className="btn" onClick={onToggle}>
            {expanded ? 'Hide' : 'Details'}
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={7} style={{ padding: '0 16px 16px' }}>
            <RunDetails run={run} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function RunDetails({ run }: { run: JobRun }) {
  return (
    <div>
      {run.error ? (
        <div className="error-banner" style={{ marginBottom: 12 }}>
          {run.error}
        </div>
      ) : null}

      {run.stepRuns && run.stepRuns.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>Step</th>
              <th>Type</th>
              <th>Status</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            {run.stepRuns.map((step: StepRun) => (
              <tr key={step.id}>
                <td className="mono">{step.stepId}</td>
                <td className="mono">{step.type}</td>
                <td>
                  <span className={`badge ${STATUS_CLASS[step.status] || 'pending'}`}>
                    {step.status}
                  </span>
                </td>
                <td>
                  {step.error ? (
                    <div className="error-banner" style={{ margin: 0 }}>
                      {step.error}
                    </div>
                  ) : step.output ? (
                    <pre className="mono" style={{ whiteSpace: 'pre-wrap' }}>
                      {typeof step.output === 'string'
                        ? step.output
                        : JSON.stringify(step.output, null, 2)}
                    </pre>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">No step details for this run.</div>
      )}
    </div>
  );
}
