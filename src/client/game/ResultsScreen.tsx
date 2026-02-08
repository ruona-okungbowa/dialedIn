import type { GuessResult, RoundSummary } from '../../shared/types';
import { buildWavelengthString } from '../../shared/gameLogic';

type ResultsScreenProps = {
  results: GuessResult[] | null;
  onPlayAgain?: () => void;
};

export const ResultsScreen = ({ results, onPlayAgain }: ResultsScreenProps) => {
  if (!results?.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <h1 className="mb-2 text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
          Results
        </h1>
        <p className="max-w-md text-center text-sm md:text-base text-gray-600 dark:text-slate-400">
          Play today&apos;s 3 rounds to see your score breakdown and Wavelength
          String here.
        </p>
      </div>
    );
  }

  const totalScore = results.reduce(
    (sum, r) => sum + (typeof r.score === 'number' ? r.score : 0),
    0,
  );

  const roundSummaries: RoundSummary[] = results.map((r) => ({
    roundIndex: r.roundIndex,
    dialValue: r.dialValue,
    target: r.target,
    redditAverage: r.redditAverage,
    score: r.score,
    distanceFromTarget: r.distanceFromTarget,
  }));

  const shareString = buildWavelengthString(roundSummaries);

  return (
    <div className="flex h-full w-full flex-col items-center gap-4 md:gap-6 overflow-y-auto p-4 md:p-6 page-transition">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 dark:bg-slate-800 px-4 md:px-6 py-4 md:py-5 text-white shadow-xl fade-in">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-300">
              Daily Total
            </p>
            <p className="mt-1 text-3xl md:text-4xl font-black tracking-tight">
              {totalScore}
            </p>
          </div>
          <div className="text-right text-xs md:text-sm text-slate-300 dark:text-slate-400">
            <p>
              Rounds{' '}
              <span className="font-semibold">
                {results.length} / 3 completed
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-xl space-y-3">
        {results.map((r, index) => (
          <div
            key={r.roundIndex}
            className="flex items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-3 md:px-4 py-3 slide-in-right"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Round {r.roundIndex + 1}
              </p>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
                You: <span className="font-semibold">{r.dialValue}</span> ·
                Target: <span className="font-semibold">{r.target}</span> ·
                Reddit:{' '}
                <span className="font-semibold">
                  {r.redditAverage.toFixed(1)}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Score
              </p>
              <p className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">
                {r.score}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full max-w-xl space-y-3">
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 fade-in">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Wavelength String
          </p>
          <p className="break-words text-xs md:text-sm font-medium text-slate-800 dark:text-slate-200">
            {shareString}
          </p>
          <button
            type="button"
            className="mt-3 rounded-full bg-slate-900 dark:bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-black dark:hover:bg-slate-600 transition-colors touch-manipulation"
            onClick={() => {
              void navigator.clipboard?.writeText(shareString);
            }}
          >
            Copy to clipboard
          </button>
        </div>

        {onPlayAgain && (
          <button
            type="button"
            className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            onClick={onPlayAgain}
          >
            Back to today&apos;s dial
          </button>
        )}
      </div>
    </div>
  );
};

