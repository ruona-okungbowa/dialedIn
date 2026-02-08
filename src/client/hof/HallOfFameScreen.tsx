import { useEffect, useState } from 'react';

import type {
  LeaderboardEntry,
  LeaderboardResponse,
  UserStatsResponse,
} from '../../shared/types/api';

type Tab = 'score' | 'streak' | 'aligned' | 'controversial';

export const HallOfFameScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(
    null,
  );
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('score');

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [lbRes, statsRes] = await Promise.all([
          fetch('/api/leaderboard'),
          fetch('/api/user-stats'),
        ]);

        if (!lbRes.ok) {
          throw new Error('Failed to load leaderboard');
        }
        if (!statsRes.ok) {
          throw new Error('Failed to load user stats');
        }

        const lb = (await lbRes.json()) as LeaderboardResponse;
        const stats = (await statsRes.json()) as UserStatsResponse;

        if (cancelled) return;

        setLeaderboard(lb);
        setUserStats(stats);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentUserId = userStats?.userId;

  const getActiveEntries = (): LeaderboardEntry[] => {
    if (!leaderboard) return [];
    switch (tab) {
      case 'streak':
        return leaderboard.topStreaks;
      case 'aligned':
        return leaderboard.mostAligned;
      case 'controversial':
        return leaderboard.mostControversial;
      case 'score':
      default:
        return leaderboard.topTotalScore;
    }
  };

  const describeMetric = (entry: LeaderboardEntry): string => {
    switch (tab) {
      case 'streak':
        return `${entry.streakCurrent} day streak`;
      case 'aligned':
        return `${entry.averageDistanceToTarget.toFixed(
          1,
        )} away from target on average`;
      case 'controversial':
        return `${entry.averageDistanceFromReddit.toFixed(
          1,
        )} away from Reddit on average`;
      case 'score':
      default:
        return `${entry.totalScore} lifetime score`;
    }
  };

  const activeEntries = getActiveEntries();

  return (
    <div className="flex h-full w-full flex-col items-center overflow-y-auto bg-slate-950/95 py-8 px-4 text-white">
      <div className="w-full max-w-4xl">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              Hall of Fame
            </h1>
            <p className="mt-1 text-sm text-slate-300">
              See who&apos;s most dialed in, most on the wavelength, and most
              gloriously unhinged.
            </p>
          </div>

          <div className="inline-flex gap-2 rounded-full bg-slate-900/80 p-1 text-xs font-semibold">
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                tab === 'score'
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setTab('score')}
            >
              Top score
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1 ${
                tab === 'streak'
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setTab('streak')}
            >
              Longest streaks
            </button>
            <button
              type="button"
              className={`hidden rounded-full px-3 py-1 md:inline-block ${
                tab === 'aligned'
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setTab('aligned')}
            >
              Most aligned
            </button>
            <button
              type="button"
              className={`hidden rounded-full px-3 py-1 md:inline-block ${
                tab === 'controversial'
                  ? 'bg-amber-400 text-amber-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              onClick={() => setTab('controversial')}
            >
              Most controversial
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 rounded-xl bg-red-500/15 p-3 text-xs font-semibold text-red-200">
            {error}
          </div>
        )}

        {userStats && (
          <section className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-900/80 p-4 text-sm ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Your streak
              </p>
              {userStats.stats ? (
                <>
                  <p className="mt-1 text-2xl font-black text-amber-300">
                    {userStats.stats.streak.current} days
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Best: {userStats.stats.streak.best} · Rank{' '}
                    {userStats.ranks?.streakRank ?? '—'}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Play today&apos;s game to start a streak.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-4 text-sm ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Lifetime score
              </p>
              {userStats.stats ? (
                <>
                  <p className="mt-1 text-2xl font-black text-emerald-300">
                    {userStats.stats.totalScore}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Rank {userStats.ranks?.totalScoreRank ?? '—'}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Finish a full 3‑round game to enter the leaderboard.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-4 text-sm ring-1 ring-white/10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Your flavour
              </p>
              {userStats.stats && userStats.stats.gamesPlayed > 0 ? (
                <>
                  <p className="mt-1 text-sm text-slate-200">
                    <span className="font-semibold text-emerald-300">
                      Alignment:{' '}
                    </span>
                    {userStats.stats.averageDistanceToTarget.toFixed(1)} away
                    from target on average.
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    <span className="font-semibold text-rose-300">
                      Controversy:{' '}
                    </span>
                    {userStats.stats.averageDistanceFromReddit.toFixed(1)} away
                    from Reddit on average.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Once you&apos;ve played a few days we&apos;ll tell you if
                  you&apos;re a consensus builder or chaos agent.
                </p>
              )}
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-slate-900/80 p-4 text-sm ring-1 ring-white/10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {tab === 'score' && 'Top lifetime scores'}
              {tab === 'streak' && 'Longest streaks'}
              {tab === 'aligned' && 'Most aligned with the dial'}
              {tab === 'controversial' && 'Most controversial guessers'}
            </h2>
            <span className="text-[11px] text-slate-500">
              Showing top {activeEntries.length || 0}
            </span>
          </div>

          {loading && (
            <p className="text-xs text-slate-300">Loading Hall of Fame…</p>
          )}

          {!loading && activeEntries.length === 0 && (
            <p className="text-xs text-slate-300">
              No one has reached the Hall of Fame yet. Play a few days and you
              might be the first!
            </p>
          )}

          {!loading && activeEntries.length > 0 && (
            <ol className="mt-2 space-y-1 text-xs">
              {activeEntries.map((entry, index) => {
                const isYou = currentUserId && entry.userId === currentUserId;
                return (
                  <li
                    key={`${entry.userId}-${index.toString()}`}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                      isYou ? 'bg-amber-400/15' : 'bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-semibold text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-semibold">
                        {isYou ? 'You' : entry.userId}
                      </span>
                    </div>
                    <p className="text-right text-[11px] text-slate-300">
                      {describeMetric(entry)}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};


