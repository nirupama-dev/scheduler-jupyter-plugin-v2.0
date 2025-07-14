import React from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams
} from 'react-router-dom';
import { CreateNotebookSchedule } from '../components/notebookScheduler/CreateNotebookSchedule';

// Dummy ListingScreen for demonstration
function ListingScreen() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>Listing Screen</h2>
      <button onClick={() => navigate('/create')}>Go to Create</button>
      <button onClick={() => navigate('/history/123')}>
        Go to History for 123
      </button>
    </div>
  );
}

// Dummy ExecutionHistoryScreen for demonstration
function ExecutionHistoryScreen() {
  const { id } = useParams();
  return (
    <div>
      <h2>Execution History</h2>
      <div>History for job: {id}</div>
    </div>
  );
}

export function SchedulerRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/list" replace />} />
      <Route path="/create" element={<CreateNotebookSchedule />} />
      <Route path="/list" element={<ListingScreen />} />
      <Route path="/history/:id" element={<ExecutionHistoryScreen />} />
    </Routes>
  );
}
