import { useState, useEffect } from 'react';
import { exitExpandedMode } from '@devvit/web/client';

import type { SpectrumSubmission } from '../../shared/types';
import type {
  SpectrumLabListResponse,
  SpectrumLabVoteRequest,
  SpectrumLabVoteResponse,
} from '../../shared/types/api';

type SortOption = 'top' | 'new' | 'rising';

export const VoteScreen = () => {
  const [submissions, setSubmissions] = useState<SpectrumSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('top');
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/spectrum-lab');
        if (!res.ok) {
          throw new Error('Failed to load submissions');
        }
        const data = (await res.json()) as SpectrumLabListResponse;
        if (cancelled) return;
        setSubmissions(data.submissions ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSubmissions();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleVote = async (submissionId: string, direction: 'up' | 'down') => {
    setVotingId(submissionId);
    setError(null);

    try {
      const body: SpectrumLabVoteRequest = {
        submissionId,
        direction,
      };

      const res = await fetch('/api/spectrum-lab/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to vote');
      }

      const data = (await res.json()) as SpectrumLabVoteResponse;

      setSubmissions((prev) => {
        const idx = prev.findIndex((s) => s.id === data.submission.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = data.submission;
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setVotingId(null);
    }
  };

  const sortedSubmissions = (() => {
    const filtered = submissions.filter((s) => s.status === 'pending_review');

    if (sortBy === 'new') {
      return [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    if (sortBy === 'rising') {
      // Simple rising algorithm: recent submissions with positive score
      const now = Date.now();
      return [...filtered].sort((a, b) => {
        const aAge = now - new Date(a.createdAt).getTime();
        const bAge = now - new Date(b.createdAt).getTime();
        const aRising = a.score / (aAge / 3600000 + 2); // Score per hour
        const bRising = b.score / (bAge / 3600000 + 2);
        return bRising - aRising;
      });
    }

    // Default: top (by score)
    return [...filtered].sort((a, b) => b.score - a.score);
  })();

  const getBadge = (submission: SpectrumSubmission) => {
    if (submission.score >= 1000) {
      return { text: '🔥 Trending', className: 'badge-trending' };
    }
    if (submission.score >= 500) {
      return { text: '✨ Near Approval', className: 'badge-approval' };
    }
    return null;
  };

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden py-4 md:py-8 px-4 md:px-6"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' }}
    >
      {/* Pattern overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Gradient blobs */}
      <div className="fixed bottom-0 left-0 w-full h-64 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pink-500/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-cyan-400/30 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-20 w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 mb-6 md:mb-12 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={async (e) => {
              try {
                await exitExpandedMode(e.nativeEvent);
              } catch (error) {
                console.error('Failed to exit expanded mode:', error);
              }
            }}
            className="text-white px-4 md:px-6 py-2 md:py-3 rounded-2xl font-black uppercase tracking-wider flex items-center gap-2 transition-all text-sm md:text-base"
            style={{
              background: '#8b5cf6',
              boxShadow: '0 4px 0px #5b21b6',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(2px)';
              e.currentTarget.style.boxShadow = '0 2px 0px #5b21b6';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 0px #5b21b6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 0px #5b21b6';
            }}
          >
            <span className="material-symbols-outlined text-lg md:text-xl">arrow_back</span>
            <span className="hidden sm:inline">Back to Menu</span>
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-white font-black text-3xl md:text-4xl lg:text-5xl tracking-tighter uppercase italic drop-shadow-lg">
            Spectrum Gallery
          </h1>
          <p className="text-white/80 font-bold text-xs md:text-sm tracking-widest uppercase mt-1">
            Community Submissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/70 font-black text-xs uppercase tracking-widest">
            Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white/10 border-2 border-white/20 rounded-xl px-3 md:px-4 py-2 pr-8 md:pr-10 text-white font-bold focus:ring-0 focus:border-white transition-all outline-none text-sm md:text-base"
            style={{
              appearance: 'none',
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.25rem',
            }}
          >
            <option value="top">Top</option>
            <option value="new">New</option>
            <option value="rising">Rising</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-6xl mx-auto flex-1 overflow-y-auto overflow-x-hidden">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 mb-6">
            <p className="text-red-200 text-sm font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-white text-xl font-bold">Loading submissions...</p>
          </div>
        ) : sortedSubmissions.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-white/70 text-lg font-bold">No submissions yet. Be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6 pb-6">
            {sortedSubmissions.map((submission) => {
              const badge = getBadge(submission);
              const isVoting = votingId === submission.id;

              return (
                <div
                  key={submission.id}
                  className="flex flex-col md:flex-row overflow-hidden transition-all hover:translate-y-[-4px]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.3)',
                    borderRadius: '2rem',
                  }}
                >
                  {/* Vote Section */}
                  <div className="bg-black/20 md:w-24 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-4 p-3 md:p-0">
                    <button
                      onClick={() => handleVote(submission.id, 'up')}
                      disabled={isVoting}
                      className="vote-btn group disabled:opacity-50 transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-white/40 group-hover:text-[#f472b6] text-4xl md:text-5xl font-black transition-colors">
                        expand_less
                      </span>
                    </button>
                    <span className="text-white font-black text-xl md:text-2xl min-w-[3rem] text-center">
                      {submission.score}
                    </span>
                    <button
                      onClick={() => handleVote(submission.id, 'down')}
                      disabled={isVoting || submission.score <= 0}
                      className="vote-btn group disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-white/40 group-hover:text-cyan-400 text-4xl md:text-5xl font-black transition-colors">
                        expand_more
                      </span>
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8 items-center">
                    {/* Dial Preview */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="relative w-40 md:w-48 h-20 md:h-24 overflow-hidden mb-2 md:mb-3">
                        <div
                          className="absolute inset-0 opacity-80"
                          style={{
                            background:
                              'conic-gradient(from 270deg at 50% 100%, #2dd4bf, #fbbf24, #f97316, #ef4444)',
                            mask: 'radial-gradient(circle at 50% 100%, transparent 55%, black 56%)',
                            WebkitMask:
                              'radial-gradient(circle at 50% 100%, transparent 55%, black 56%)',
                            borderRadius: '999px 999px 0 0',
                          }}
                        />
                        <div className="absolute bottom-0 w-full h-0.5 bg-white/20" />
                      </div>
                      <div className="flex justify-between w-40 md:w-48 text-white/90 font-black uppercase text-[10px] tracking-widest">
                        <span className="truncate max-w-[45%]">{submission.leftLabel}</span>
                        <span className="truncate max-w-[45%]">{submission.rightLabel}</span>
                      </div>
                    </div>

                    {/* Clues Section */}
                    {submission.sampleClue && (
                      <div className="flex-1 w-full">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 md:p-4">
                          <span className="text-[#fbbf24] text-[10px] font-black uppercase tracking-widest mb-1 block">
                            Sample Clue
                          </span>
                          <p className="text-white font-bold text-base md:text-lg leading-tight">
                            {submission.sampleClue}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Badge */}
                    {badge && (
                      <div className="lg:w-32 flex justify-center">
                        <span
                          className={`text-white text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-2 rounded-full whitespace-nowrap`}
                          style={
                            badge.className === 'badge-trending'
                              ? {
                                  background: 'linear-gradient(45deg, #f97316, #ef4444)',
                                  boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)',
                                }
                              : {
                                  background: 'linear-gradient(45deg, #2dd4bf, #4ade80)',
                                  boxShadow: '0 0 15px rgba(45, 212, 191, 0.4)',
                                }
                          }
                        >
                          {badge.text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <footer className="relative z-10 mt-8 md:mt-16 pb-6 md:pb-8 text-center">
          <div className="bg-indigo-900/40 p-4 md:p-6 rounded-3xl border border-white/10 inline-block max-w-xl">
            <p className="text-white/90 text-xs md:text-sm font-semibold flex items-center gap-3 justify-center flex-wrap">
              <span className="material-symbols-outlined text-[#fbbf24] flex-shrink-0">info</span>
              <span>
                Vote for your favorite spectrums! Top-voted submissions are added to the game core
                rotation every week.
              </span>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};
