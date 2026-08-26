import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_JOB, GET_JOBS, UPDATE_JOB } from '../graphql';
import type { Job } from '../types';

interface Step {
  id: string;
  type: string;
  config: Record<string, string>;
}

type StepType = 'business_card.generate' | 'webhook.call' | 'email.send';

const STEP_TYPES: StepType[] = [
  'business_card.generate',
  'webhook.call',
  'email.send',
];

// Default config fields per step type
const STEP_CONFIG_FIELDS: Record<StepType, string[]> = {
  'business_card.generate': ['fullName', 'title', 'email', 'company', 'phone', 'skills'],
  'webhook.call': ['url', 'method'],
  'email.send': ['to', 'subject', 'body'],
};

interface Props {
  jobId: number | null;
  onDone: () => void;
  onCancel: () => void;
}

const emptyStep = (): Step => ({
  id: `step-${Date.now()}`,
  type: 'business_card.generate',
  config: {},
});

function parseParams(params?: string | null): Step[] {
  if (!params) return [];
  try {
    const parsed = JSON.parse(params);
    const steps = parsed?.steps || [];
    return steps.map((s: Record<string, unknown>) => ({
      id: String(s.id || 'step'),
      type: String(s.type || ''),
      config: (s.config as Record<string, unknown> || {}) as Record<string, string>,
    }));
  } catch {
    return [];
  }
}

export default function JobForm({ jobId, onDone, onCancel }: Props) {
  const isEdit = jobId !== null;

  const { data: jobsData } = useQuery<{ jobs: Job[] }>(GET_JOBS);
  const existing = jobsData?.jobs?.find((j) => j.id === jobId);

  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cron, setCron] = useState('0 9 * * 1-5');
  const [timezone, setTimezone] = useState('UTC');
  const [enabled, setEnabled] = useState(true);
  const [steps, setSteps] = useState<Step[]>([emptyStep()]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setKey(existing.key);
      setName(existing.name);
      setDescription(existing.description || '');
      setCron(existing.cron);
      setTimezone(existing.timezone);
      setEnabled(existing.enabled);
      const parsed = parseParams(existing.params);
      setSteps(parsed.length ? parsed : [emptyStep()]);
    }
  }, [existing]);

  const [createJob] = useMutation(CREATE_JOB);
  const [updateJob] = useMutation(UPDATE_JOB);

  const updateStep = (index: number, patch: Partial<Step>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const updateStepConfig = (index: number, field: string, value: string) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, config: { ...s.config, [field]: value } } : s,
      ),
    );
  };

  const addStep = () => setSteps((prev) => [...prev, emptyStep()]);
  const removeStep = (index: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== index));

  const buildParamsJson = () => {
    const cleanSteps = steps
      .filter((s) => s.type)
      .map((s) => ({
        id: s.id || `step-${Date.now()}`,
        type: s.type,
        config: s.config,
      }));
    return JSON.stringify({ steps: cleanSteps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const params = buildParamsJson();

    try {
      if (isEdit && jobId !== null) {
        await updateJob({
          variables: {
            input: { id: jobId, key, name, description, cron, timezone, enabled, params },
          },
        });
      } else {
        await createJob({
          variables: {
            input: { key, name, description, cron, timezone, enabled, params },
          },
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{isEdit ? 'Edit Job' : 'New Job'}</h2>
      {error ? <div className="form-error">{error}</div> : null}

      <div className="field">
        <label htmlFor="key">Key</label>
        <input
          id="key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="my-job"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Job"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="field">
        <label htmlFor="cron">Cron expression</label>
        <input
          id="cron"
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="0 9 * * 1-5"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="timezone">Timezone</label>
        <input
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="UTC"
        />
      </div>

      <div className="field">
        <label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />{' '}
          Enabled
        </label>
      </div>

      <div className="field">
        <label>Pipeline steps</label>
        {steps.map((step, i) => (
          <div className="step-editor" key={i}>
            <div className="step-row">
              <input
                type="text"
                value={step.id}
                onChange={(e) => updateStep(i, { id: e.target.value })}
                placeholder="step id"
                required
              />
              <select
                value={step.type}
                onChange={(e) =>
                  updateStep(i, { type: e.target.value as StepType, config: {} })
                }
              >
                {STEP_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => removeStep(i)}
                disabled={steps.length === 1}
              >
                Remove
              </button>
            </div>

            {STEP_CONFIG_FIELDS[step.type as StepType]?.map((field) => (
              <div className="field" key={field} style={{ marginBottom: 8 }}>
                <label htmlFor={`${step.id}-${field}`}>{field}</label>
                <input
                  id={`${step.id}-${field}`}
                  value={step.config[field] || ''}
                  onChange={(e) => updateStepConfig(i, field, e.target.value)}
                  placeholder={field}
                />
              </div>
            ))}
          </div>
        ))}

        <button type="button" className="btn" onClick={addStep}>
          + Add step
        </button>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Save' : 'Create'}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
