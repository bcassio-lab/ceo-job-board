'use client';
import { useState } from 'react';

export default function ApplyModal({ job }) {
  const [isOpen, setIsOpen] = useState(false);
  const [ceoId, setCeoId] = useState('');
  const = useState(false);

  const handleApply = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Send the tracking data to the API route you built in Step 2
      await fetch('/api/log-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, ceoId }),
      });
    } catch (err) {
      console.error("Tracking error:", err);
    } finally {
      // Open the job application in a new tab and close the modal
      setIsSubmitting(false);
      setIsOpen(false);
      window.open(job.url, '_blank');
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors"
      >
        Apply Now
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2">Participant Check-In</h2>
            <p className="text-gray-600 text-sm mb-4">Please enter your CEO ID before applying to this position.</p>
            
            <form onSubmit={handleApply}>
              <input
                type="text"
                required
                value={ceoId}
                onChange={(e) => setCeoId(e.target.value)}
                placeholder="CEO ID Number"
                className="w-full border border-gray-300 p-2 mb-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting? 'Processing...' : 'Continue to Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
