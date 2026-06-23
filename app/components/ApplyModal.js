'use client';
import { useState } from 'react';

export default function ApplyModal({ job }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApply = async () => {
    setIsSubmitting(true);

    try {
      await fetch('/api/log-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
    } catch (err) {
      console.error("Tracking error:", err);
    } finally {
      setIsSubmitting(false);
      window.open(job.url, '_blank');
    }
  };

  return (
    <button
      onClick={handleApply}
      disabled={isSubmitting}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50"
    >
      {isSubmitting ? 'Opening...' : 'Apply Now'}
    </button>
  );
}
