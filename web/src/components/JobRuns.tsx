import { useQuery } from '@apollo/client';
import { GET_JOB_RUNS } from '../graphql';
import type { JobRun, StepRun } from '../types';

interface Props {
  jobId: number;
  onClose: () => void;
}

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

export default function JobRuns({ jobId, onClose }: Props) {
  const { data, loading, error } = useQuery(GET_JOB_RUNS, {
    variables: { id: jobId },
  });

  const runs: JobRun[] = data?.job?.runs || [];

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 1000,
        overflowY: 'auto',
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 900, width: '100%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Runs — {data?.job?.name || `#${jobId}`}</h2>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? <div className="loading">Loading runs…</div> : null}
        {error ? <div className="error-banner">Error: {error.message}</div> : null}

        {!loading && !error && runs.length === 0 ? (
          <div className="empty">No runs yet.</div>
        ) : null}

        {runs.map((run) => (
          <div key={run.id} style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <strong>Run #{run.id}</strong>
              <span className={`badge ${STATUS_CLASS[run.status] || 'pending'}`}>
                {run.status}
              </span>
              <span className="mono">trigger: {run.trigger}</span>
              <span className="mono">{formatDate(run.startedAt)}</span>
              {run.finishedAt ? (
                <span className="mono">→ {formatDate(run.finishedAt)}</span>
              ) : null}
            </div>
            {run.error ? (
              <div className="error-banner" style={{ margin: '8px 0' }}>
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
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
