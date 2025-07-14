import React from 'react';
import { useNavigate } from 'react-router-dom';
 
export const CreateNotebookSchedule = () => {
  const navigate = useNavigate();
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ...submit logic...
    navigate('/list');
  };
 
  return (
<form onSubmit={handleSubmit}>
<h2>Create Schedule</h2>
<input type="text" placeholder="Job Name" required />
<button type="submit">Submit</button>
</form>
  );
}