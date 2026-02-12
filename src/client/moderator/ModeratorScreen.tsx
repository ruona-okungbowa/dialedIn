import { useEffect, useState, FormEvent } from 'react';

import type { SpectrumSubmission } from '../../shared/types';
import type {
  ModeratorPendingListResponse,
  ModeratorApproveRequest,
  ModeratorApproveResponse,
  ModeratorRejectRequest,
  ModeratorRejectResponse,
} from '../../shared/types/api';

export const ModeratorScreen = () => {
  const [submissions, setSubmissions] = useState<SpectrumSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SpectrumSubmission | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state for clues
  const [clue1, setClue1] = useState('');
  const [clue2, setClue2] = useState('');
  const [clue3, setClue3] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    void loadPending();
  }, []);

  const loadPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/moderator/pending');
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('You must be a moderator to access this page');
        }
        throw new Error('Failed to load pending submissions');
      }
      const data = (await res.json()) as ModeratorPendingListResponse;
      setSubmissions(data.submissions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSubmission) return;

    if (!clue1.trim() || !clue2.trim() || !clue3.trim()) {
      setError('All 3 clues are required');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const body: ModeratorApproveRequest = {
        submissionId: selectedSubmission.id,
        clues: [{ clue: clue1.trim() }, { clue: clue2.trim() }, { clue: clue3.trim() }],
      };

      const res = await fetch('/api/moderator/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to approve submission');
      }

      const data = (await res.json()) as ModeratorApproveResponse;

      // Remove from pending list
      setSubmissions((prev) => prev.filter((s) => s.id !== data.submission.id));
      setSelectedSubmission(null);
      resetForm();

      alert('Spectrum approved successfully!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSubmission) return;

    setProcessing(true);
    setError(null);

    try {
      const body: ModeratorRejectRequest = {
        submissionId: selectedSubmission.id,
        ...(rejectionReason.trim() ? { rejectionReason: rejectionReason.trim() } : {}),
      };

      const res = await fetch('/api/moderator/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to reject submission');
      }

      const data = (await res.json()) as ModeratorRejectResponse;

      // Remove from pending list
      setSubmissions((prev) => prev.filter((s) => s.id !== data.submission.id));
      setSelectedSubmission(null);
      resetForm();

      alert('Spectrum rejected');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setClue1('');
    setClue2('');
    setClue3('');
    setRejectionReason('');
  };

  const selectSubmission = (submission: SpectrumSubmission) => {
    setSelectedSubmission(submission);
    resetForm();
    // Pre-fill with sample clue if available
    if (submission.sampleClue) {
      setClue1(submission.sampleClue);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
        <p className="text-white text-xl font-bold">Loading...</p>
      </div>
    );
  }

  if (error && submissions.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
        <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 max-w-md">
          <p className="text-red-200 text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full w-full overflow-y-auto py-4 md:py-6 lg:py-8 px-3 md:px-4 lg:px-6"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <main className="relative z-10 w-full max-w-7xl mx-auto">
        <div className="text-center mb-4 md:mb-6 lg:mb-10">
          <h1 className="text-white font-black text-2xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tighter uppercase italic drop-shadow-lg">
            Moderator Review
          </h1>
          <p className="text-white/80 font-bold text-xs md:text-base lg:text-lg tracking-wide uppercase mt-1 md:mt-2">
            {submissions.length} Pending Submission{submissions.length !== 1 ? 's' : ''}
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <p className="text-white text-lg md:text-xl font-bold">No pending submissions</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            {/* Left: Submission List */}
            <div className="space-y-3 md:space-y-4">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => selectSubmission(submission)}
                  className={`p-3 md:p-4 lg:p-6 cursor-pointer transition-all ${
                    selectedSubmission?.id === submission.id
                      ? 'bg-white/30 border-white/50'
                      : 'bg-white/15 border-white/20 hover:bg-white/20'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px)',
                    border: '2px solid',
                    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.3)',
                    borderRadius: '1.5rem',
                  }}
                >
                  <div className="flex justify-between items-start mb-2 md:mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 md:gap-2 text-white font-black text-base md:text-lg lg:text-xl flex-wrap">
                        <span className="truncate">{submission.leftLabel}</span>
                        <span className="text-white/50 flex-shrink-0">↔</span>
                        <span className="truncate">{submission.rightLabel}</span>
                      </div>
                    </div>
                  </div>
                  {submission.sampleClue && (
                    <p className="text-white/70 text-xs md:text-sm italic mt-1.5 md:mt-2">
                      Sample: "{submission.sampleClue}"
                    </p>
                  )}
                  <p className="text-white/50 text-[10px] md:text-xs mt-1.5 md:mt-2">
                    Submitted {new Date(submission.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>

            {/* Right: Review Form */}
            {selectedSubmission && (
              <div
                className="p-4 md:p-6 lg:p-8 xl:sticky xl:top-4 h-fit"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  borderRadius: '1.5rem',
                }}
              >
                <h2 className="text-white font-black text-xl md:text-2xl mb-3 md:mb-4">
                  Review Spectrum
                </h2>

                {/* Preview */}
                <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white/10 rounded-xl">
                  <div className="flex justify-between items-center text-white font-black text-base md:text-lg flex-wrap gap-2">
                    <span className="truncate">{selectedSubmission.leftLabel}</span>
                    <span className="flex-shrink-0">↔</span>
                    <span className="truncate">{selectedSubmission.rightLabel}</span>
                  </div>
                </div>

                <form onSubmit={handleApprove} className="space-y-3 md:space-y-4">
                  {/* Clue 1 */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-white/70 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                      Clue 1
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/20 rounded-xl p-2.5 md:p-3 text-white placeholder-white/30 font-bold text-sm transition-all focus:border-teal-400 focus:outline-none"
                      placeholder="Enter first clue"
                      type="text"
                      value={clue1}
                      onChange={(e) => setClue1(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Clue 2 */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-white/70 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                      Clue 2
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/20 rounded-xl p-2.5 md:p-3 text-white placeholder-white/30 font-bold text-sm transition-all focus:border-teal-400 focus:outline-none"
                      placeholder="Enter second clue"
                      type="text"
                      value={clue2}
                      onChange={(e) => setClue2(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Clue 3 */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-white/70 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                      Clue 3
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/20 rounded-xl p-2.5 md:p-3 text-white placeholder-white/30 font-bold text-sm transition-all focus:border-teal-400 focus:outline-none"
                      placeholder="Enter third clue"
                      type="text"
                      value={clue3}
                      onChange={(e) => setClue3(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Rejection Reason */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-white/70 font-bold text-[10px] md:text-xs uppercase tracking-widest">
                      Rejection Reason (Optional)
                    </label>
                    <textarea
                      className="w-full bg-white/10 border-2 border-white/20 rounded-xl p-2.5 md:p-3 text-white placeholder-white/30 font-bold text-sm transition-all focus:border-teal-400 focus:outline-none resize-none"
                      placeholder="Why is this being rejected?"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-2.5 md:p-3">
                      <p className="text-red-200 text-xs md:text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex flex-col gap-2.5 md:gap-3 pt-1 md:pt-2">
                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full bg-green-500 hover:bg-green-600 py-2.5 md:py-3 rounded-xl text-white font-black uppercase text-xs md:text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={processing}
                      className="w-full bg-red-500 hover:bg-red-600 py-2.5 md:py-3 rounded-xl text-white font-black uppercase text-xs md:text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
