import { useEffect, useState } from 'react';

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
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    // default: "hot" – by score
    return [...submissions].sort((a, b) => b.score - a.score);
  })();

  const handleSubmit = async (event: React.FormEvent) => {
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
        sampleClue: trimmedClue || undefined,
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
    <div className="flex h-full w-full flex-col items-center bg-slate-950/95 py-8 px-4 text-white">
      <div className="w-full max-w-4xl">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Spectrum Lab
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              Submit and upvote new spectrums the community might play in future
              daily games.
            </p>
          </div>

          <div className="inline-flex gap-2 rounded-full bg-slate-900/80 p-1 text-xs font-semibold">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                tab === 'hot'
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setTab('hot')}
            >
              Hottest today
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                tab === 'newest'
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setTab('newest')}
            >
              Newest
            </button>
          </div>
        </header>

        <section className="mb-8 rounded-2xl bg-slate-900/80 p-4 shadow-lg ring-1 ring-white/10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
            Submit a spectrum
          </h2>

          <form
            className="flex flex-col gap-3 md:flex-row md:items-end"
            onSubmit={handleSubmit}
          >
            <div className="flex-1">
              <label
                htmlFor="spectrum-left-label"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Left label
              </label>
              <input
                id="spectrum-left-label"
                value={leftLabel}
                onChange={(event) => setLeftLabel(event.target.value)}
                placeholder="Masterpiece"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="spectrum-right-label"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Right label
              </label>
              <input
                id="spectrum-right-label"
                value={rightLabel}
                onChange={(event) => setRightLabel(event.target.value)}
                placeholder="Trash"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>

            <div className="flex-1">
              <label
                htmlFor="spectrum-sample-clue"
                className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400"
              >
                Sample clue (optional)
              </label>
              <input
                id="spectrum-sample-clue"
                value={sampleClue}
                onChange={(event) => setSampleClue(event.target.value)}
                placeholder="This movie&apos;s twist ending"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-amber-400 px-4 py-2 text-sm font-black uppercase tracking-wide text-amber-950 shadow-md transition hover:bg-amber-300 disabled:opacity-60 md:mt-0"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </form>

          {error && (
            <p className="mt-3 text-xs font-semibold text-red-300">{error}</p>
          )}
        </section>

        <section className="space-y-3">
          {loading && (
            <div className="rounded-xl bg-slate-900/60 p-4 text-sm text-slate-200">
              Loading community spectrums…
            </div>
          )}

          {!loading && sortedSubmissions.length === 0 && (
            <div className="rounded-xl bg-slate-900/60 p-4 text-sm text-slate-300">
              No spectrums in the lab yet. Be the first to submit one for this
              subreddit!
            </div>
          )}

          {sortedSubmissions.map((submission) => (
            <article
              key={submission.id}
              className="flex flex-col gap-3 rounded-2xl bg-slate-900/80 p-4 text-sm ring-1 ring-white/5 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                  <span>{submission.leftLabel}</span>
                  <span className="text-slate-500">↔</span>
                  <span>{submission.rightLabel}</span>
                </div>
                {submission.sampleClue && (
                  <p className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">
                      Sample clue:{' '}
                    </span>
                    {submission.sampleClue}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Submitted{' '}
                  {new Date(submission.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <div className="flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleVote(submission.id, 'up')}
                    disabled={votingId === submission.id}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-60"
                  >
                    <span>▲</span>
                    <span>{submission.upvotes}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVote(submission.id, 'down')}
                    disabled={votingId === submission.id}
                    className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2 py-1 text-rose-300 hover:bg-rose-500/30 disabled:opacity-60"
                  >
                    <span>▼</span>
                    <span>{submission.downvotes}</span>
                  </button>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-amber-300">
                    Score {submission.score >= 0 ? '+' : ''}
                    {submission.score}
                  </p>
                  <p className="text-[10px] text-slate-400">Lab heat</p>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
};


