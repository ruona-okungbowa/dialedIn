import { useEffect, useState, FormEvent } from 'react';

import type { SpectrumSubmission } from '../../shared/types';
import type {
  SpectrumLabListResponse,
  SpectrumLabSubmitRequest,
  SpectrumLabSubmitResponse,
  SpectrumLabVoteRequest,
  SpectrumLabVoteResponse,
} from '../../shared/types/api';

type LabTab = 'hot' | 'newest';

export const SpectrumLabScreen = () => {
  const [submissions, setSubmissions] = useState<SpectrumSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<LabTab>('hot');

  const [leftLabel, setLeftLabel] = useState('');
  const [rightLabel, setRightLabel] = useState('');
  const [sampleClue, setSampleClue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLab = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/spectrum-lab');
        if (!res.ok) {
          throw new Error('Failed to load Spectrum Lab');
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

    void loadLab();

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedSubmissions = (() => {
    if (tab === 'newest') {
      return [...submissions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    // default: "hot" – by score
    return [...submissions].sort((a, b) => b.score - a.score);
  })();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedLeft = leftLabel.trim();
    const trimmedRight = rightLabel.trim();
    const trimmedClue = sampleClue.trim();

    if (!trimmedLeft || !trimmedRight) {
      setError('Please add both left and right labels for your spectrum.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: SpectrumLabSubmitRequest = {
        leftLabel: trimmedLeft,
        rightLabel: trimmedRight,
        ...(trimmedClue && { sampleClue: trimmedClue }),
      };

      const res = await fetch('/api/spectrum-lab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error('Failed to submit spectrum');
      }

      const data = (await res.json()) as SpectrumLabSubmitResponse;
      setSubmissions((prev) => [data.submission, ...prev]);
      setLeftLabel('');
      setRightLabel('');
      setSampleClue('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

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
        throw new Error('Failed to vote on spectrum');
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

  return (
    <div
      className="relative flex h-full w-full flex-col items-center overflow-y-auto py-4 md:py-8 px-4 md:px-6"
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
      <div className="fixed bottom-0 left-0 w-full h-32 md:h-64 pointer-events-none overflow-hidden opacity-50">
        <div className="absolute -bottom-10 -left-10 w-48 md:w-64 h-48 md:h-64 bg-pink-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -right-10 w-48 md:w-64 h-48 md:h-64 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 md:mb-10">
          <h1 className="text-white font-black text-3xl md:text-5xl lg:text-6xl tracking-tighter uppercase italic drop-shadow-lg">
            Create a Spectrum
          </h1>
          <p className="text-white/80 font-bold text-sm md:text-lg tracking-wide uppercase mt-2">
            Submit your idea to the community
          </p>
        </div>

        {/* Form Card */}
        <div
          className="w-full p-6 md:p-8 lg:p-12 flex flex-col gap-6 md:gap-8"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            borderRadius: '2.5rem',
          }}
        >
          {/* Preview Dial */}
          <div className="flex flex-col items-center">
            <div className="relative w-48 md:w-64 h-24 md:h-32 overflow-hidden mb-3 md:mb-4">
              <div
                className="absolute inset-0 shadow-inner"
                style={{
                  background:
                    'conic-gradient(from 270deg at 50% 100%, #2dd4bf, #fbbf24, #f97316, #ef4444)',
                  mask: 'radial-gradient(circle at 50% 100%, transparent 45%, black 46%)',
                  WebkitMask: 'radial-gradient(circle at 50% 100%, transparent 45%, black 46%)',
                  borderRadius: '50% 50% 0 0',
                }}
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-[80%] bg-white rounded-t-full shadow-lg z-20" />
            </div>
            <div className="flex justify-between w-48 md:w-64 text-white font-black uppercase text-[10px] md:text-xs tracking-widest px-2">
              <span className="truncate max-w-[45%]">{leftLabel || 'Left Label'}</span>
              <span className="truncate max-w-[45%] text-right">{rightLabel || 'Right Label'}</span>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <label className="text-white/70 font-bold text-xs md:text-sm uppercase tracking-widest ml-1">
                Left Label
              </label>
              <input
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-base md:text-lg transition-all focus:border-teal-400 focus:outline-none"
                placeholder="e.g. Weak Coffee"
                type="text"
                value={leftLabel}
                onChange={(e) => setLeftLabel(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/70 font-bold text-xs md:text-sm uppercase tracking-widest ml-1">
                Right Label
              </label>
              <input
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-base md:text-lg transition-all focus:border-teal-400 focus:outline-none"
                placeholder="e.g. Rocket Fuel"
                type="text"
                value={rightLabel}
                onChange={(e) => setRightLabel(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/70 font-bold text-xs md:text-sm uppercase tracking-widest ml-1">
                Optional Clue
              </label>
              <input
                className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-base md:text-lg italic transition-all focus:border-teal-400 focus:outline-none"
                placeholder="e.g. Espresso Shot"
                type="text"
                value={sampleClue}
                onChange={(e) => setSampleClue(e.target.value)}
                maxLength={50}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-3 md:p-4">
                <p className="text-red-200 text-sm md:text-base font-medium">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-3 md:gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full chunky-button-yellow py-4 md:py-6 rounded-3xl flex items-center justify-center gap-2 md:gap-3 transition-all disabled:opacity-50"
                onMouseDown={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(3px)';
                    e.currentTarget.style.boxShadow = '0 3px 0px #c2410c';
                  }
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 6px 0px #c2410c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 6px 0px #c2410c';
                }}
              >
                <span className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                  {submitting ? 'Submitting...' : 'Submit'}
                </span>
              </button>
              <button className="outline-button w-full  py-4 md:py-6 rounded-3xl flex items-center justify-center gap-2 md:gap-3 text-center text-white font-black uppercase text-xl tracking-widest">
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Text */}
        <p className="text-center text-white/50 text-xs md:text-sm px-4 md:px-8 leading-relaxed font-medium">
          Your submission will be reviewed by the community. Popular spectrums may be featured in
          future games!
        </p>
      </main>
    </div>
  );
};
