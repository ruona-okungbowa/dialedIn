import { useEffect, useState } from 'react';

import type { LeaderboardResponse, UserStatsResponse } from '../../shared/types/api';
import { exitExpandedMode } from '@devvit/web/client';

type PeriodTab = 'weekly' | 'alltime';

export const HallOfFameScreen = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [userStats, setUserStats] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodTab, setPeriodTab] = useState<PeriodTab>('weekly');
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  // Calculate time until next Monday (end of week)
  useEffect(() => {
    const calculateTimeUntilReset = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();

      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

      // Create date for next Monday at midnight
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);

      // Calculate difference
      const diff = nextMonday.getTime() - now.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        return `${days}d ${hours}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    // Update immediately
    setTimeUntilReset(calculateTimeUntilReset());

    // Update every minute
    const interval = setInterval(() => {
      setTimeUntilReset(calculateTimeUntilReset());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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

  const currentUserDisplay = userStats?.stats?.username ?? userStats?.userId;

  const activeEntries =
    periodTab === 'weekly' ? leaderboard?.topWeeklyScore || [] : leaderboard?.topTotalScore || [];

  const userRank =
    periodTab === 'weekly'
      ? userStats?.ranks?.weeklyScoreRank || 0
      : userStats?.ranks?.totalScoreRank || 0;
  const userScore =
    periodTab === 'weekly' ? userStats?.stats?.weeklyScore || 0 : userStats?.stats?.totalScore || 0;

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-yellow-300 text-yellow-900 ring-2 ring-yellow-400/30';
    if (rank === 2) return 'bg-slate-300 text-slate-700';
    if (rank === 3) return 'bg-orange-400 text-orange-950';
    return 'text-white/40';
  };

  return (
    <div
      className="relative flex h-full w-full flex-col items-center overflow-hidden py-4 px-4 text-white"
      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)' }}
    >
      <div className="fixed inset-0 vibrant-pattern pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/20 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        <div className="text-center mb-6">
          <h1
            className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tighter"
            style={{ textShadow: '0 0 15px rgba(45, 212, 191, 0.6)' }}
          >
            HALL OF FAME
          </h1>
          <p className="text-teal-300 font-bold uppercase tracking-[0.3em] text-xs">
            Dial It In Legendaries
          </p>
        </div>

        <div className="flex bg-black/40 p-1.5 rounded-2xl mb-6 border border-white/10">
          <button
            type="button"
            className={`px-6 md:px-8 py-2.5 rounded-xl font-bold text-base md:text-lg ${
              periodTab === 'weekly' ? 'bg-white text-purple-900' : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setPeriodTab('weekly')}
          >
            Weekly
          </button>
          <button
            type="button"
            className={`px-6 md:px-8 py-2.5 rounded-xl font-bold text-base md:text-lg ${
              periodTab === 'alltime'
                ? 'bg-white text-purple-900'
                : 'text-white/60 hover:text-white'
            }`}
            onClick={() => setPeriodTab('alltime')}
          >
            All-Time
          </button>
        </div>

        <div
          className="w-full rounded-[2.5rem] relative overflow-hidden flex flex-col max-h-[60vh] md:max-h-[700px]"
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            backdropFilter: 'blur(16px)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent z-20" />

          <div className="flex items-center justify-between p-4 md:p-6 lg:p-8 pb-3 md:pb-4 flex-shrink-0">
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-xl md:text-2xl">🏆</span>
              <span className="hidden sm:inline">
                {periodTab === 'weekly' ? 'Weekly Top Scorers' : 'All-Time Champions'}
              </span>
              <span className="sm:hidden">{periodTab === 'weekly' ? 'Weekly' : 'All-Time'}</span>
            </h2>
            {periodTab === 'weekly' && (
              <div className="text-[10px] md:text-xs lg:text-sm text-teal-300/80 font-semibold bg-teal-900/30 px-2 md:px-3 lg:px-4 py-1 md:py-1.5 rounded-full whitespace-nowrap">
                <span className="hidden sm:inline">Resets in </span>
                {timeUntilReset || '...'}
              </div>
            )}
          </div>

          <div
            className="overflow-y-auto px-3 md:px-6 lg:px-8 pb-3 md:pb-4 space-y-2 md:space-y-3 flex-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(45, 212, 191, 0.3) rgba(255, 255, 255, 0.05)',
            }}
          >
            {loading && <p className="text-sm text-white/60 text-center py-4">Loading...</p>}
            {error && <p className="text-sm text-red-400 text-center py-4">{error}</p>}

            {!loading &&
              activeEntries.map((entry, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;

                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-2 md:gap-4 lg:gap-6 p-3 md:p-4 lg:p-5 rounded-2xl md:rounded-3xl border ${
                      rank === 1
                        ? 'bg-white/5 border-white/10 ring-2 ring-yellow-400/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 lg:w-11 lg:h-11 flex items-center justify-center rounded-full font-black text-sm md:text-lg lg:text-xl flex-shrink-0 ${getRankBadgeClass(rank)}`}
                    >
                      {rank}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <div
                        className={`w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-lg md:text-2xl lg:text-3xl flex-shrink-0 ${
                          isTop3
                            ? 'bg-white/10 border-2 border-white/20'
                            : 'bg-white/5 border border-white/10'
                        }`}
                      >
                        {rank === 1 ? '👑' : rank === 2 ? '😎' : rank === 3 ? '🎯' : '👤'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-white font-bold text-sm md:text-base lg:text-xl truncate">
                          {entry.username ?? entry.userId}
                        </div>
                        {rank === 1 && (
                          <div className="text-teal-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">
                            Reddit Champion
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div
                        className={`font-black ${
                          rank === 1
                            ? 'text-lg md:text-2xl lg:text-3xl text-yellow-400'
                            : 'text-base md:text-xl lg:text-2xl text-white/90'
                        }`}
                        style={rank === 1 ? { textShadow: '0 0 15px rgba(251, 191, 36, 0.6)' } : {}}
                      >
                        {(periodTab === 'weekly'
                          ? entry.weeklyScore
                          : entry.totalScore
                        ).toLocaleString()}
                      </div>
                      {rank === 1 && (
                        <div className="text-[9px] md:text-[10px] text-white/40 uppercase font-black hidden sm:block">
                          {periodTab === 'weekly' ? 'Weekly' : 'Total'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            <div className="h-2 md:h-4" />
          </div>

          <div
            className="w-full px-3 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5 mt-auto relative z-30 flex-shrink-0"
            style={{
              background: 'rgba(45, 212, 191, 0.15)',
              borderTop: '2px solid rgba(45, 212, 191, 0.4)',
              boxShadow: '0 -10px 25px -5px rgba(45, 212, 191, 0.15)',
            }}
          >
            <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
              <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 flex items-center justify-center rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 font-black text-xs md:text-base lg:text-xl flex-shrink-0">
                #{userRank}
              </div>

              <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                <div
                  className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-teal-400/20 rounded-full flex items-center justify-center border-2 border-teal-400/40 text-lg md:text-2xl lg:text-3xl flex-shrink-0"
                  style={{ boxShadow: '0 0 10px rgba(45, 212, 191, 0.2)' }}
                >
                  👤
                </div>
                <div className="min-w-0">
                  <div className="text-white font-bold text-sm md:text-base lg:text-xl truncate">
                    {currentUserDisplay || 'u/Username'}
                  </div>
                  <div className="text-teal-400/80 text-[9px] md:text-[10px] font-black uppercase tracking-widest hidden sm:block">
                    Personal Performance
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div
                  className="text-base md:text-xl lg:text-2xl font-bold text-white"
                  style={{ textShadow: '0 0 15px rgba(45, 212, 191, 0.6)' }}
                >
                  {userScore.toLocaleString()}
                </div>
                <div className="text-[9px] md:text-[10px] text-teal-400/60 uppercase font-black -mt-1 hidden sm:block">
                  {periodTab === 'weekly' ? 'Weekly' : 'Total'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={async (e) => {
            try {
              await exitExpandedMode(e.nativeEvent);
            } catch (error) {
              console.error('Failed to exit expanded mode:', error);
            }
          }}
          className="mt-12 chunky-button text-yellow-900 px-12 py-4 rounded-2xl font-bold text-2xl flex items-center gap-3 group"
        >
          BACK TO MENU
        </button>
      </div>
    </div>
  );
};
