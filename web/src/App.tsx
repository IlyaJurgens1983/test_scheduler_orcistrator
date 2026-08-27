import { useState } from 'react';
import JobList from './components/JobList';
import JobForm from './components/JobForm';
import History from './components/History';

type View = 'list' | 'create' | 'history';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [editingJobId, setEditingJobId] = useState<number | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Scheduler Orchestrator</h1>
        <nav className="app-nav">
          <button
            className={view === 'list' ? 'active' : ''}
            onClick={() => {
              setView('list');
              setEditingJobId(null);
            }}
          >
            Jobs
          </button>
          <button
            className={view === 'create' ? 'active' : ''}
            onClick={() => {
              setView('create');
              setEditingJobId(null);
            }}
          >
            New Job
          </button>
          <button
            className={view === 'history' ? 'active' : ''}
            onClick={() => {
              setView('history');
              setEditingJobId(null);
            }}
          >
            History
          </button>
        </nav>
      </header>
      <main className="app-main">
        {view === 'history' ? (
          <History />
        ) : view === 'list' ? (
          <JobList
            onEdit={(id) => {
              setEditingJobId(id);
              setView('create');
            }}
          />
        ) : (
          <JobForm
            jobId={editingJobId}
            onDone={() => {
              setView('list');
              setEditingJobId(null);
            }}
            onCancel={() => {
              setView('list');
              setEditingJobId(null);
            }}
          />
        )}
      </main>
    </div>
  );
}
