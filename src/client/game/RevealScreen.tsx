import type { GuessResult } from '../../shared/types';

type RevealScreenProps = {
  result: GuessResult;
  currentRoundIndex: number;
  totalScore: number;
  onNext: () => void;
  isLastRound: boolean;
};

export const RevealScreen = ({
  result,
  currentRoundIndex,
  totalScore,
  onNext,
  isLastRound,
}: RevealScreenProps) => {
  const minAngle = -90;
  const maxAngle = 90;

  const valueToAngle = (value: number): number => {
    return minAngle + (value / 100) * (maxAngle - minAngle);
  };

  const targetAngle = valueToAngle(result.target);
  const yourAngle = valueToAngle(result.dialValue);
  const redditAngle = valueToAngle(result.redditAverage);

  const getAccuracyLabel = (score: number): string => {
    if (score >= 90) return 'Perfect!';
    if (score >= 80) return 'Great!';
    if (score >= 70) return 'Good!';
    if (score >= 60) return 'Close!';
    return 'Off';
  };

  return (
    <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
      <div className="glass-results w-full max-w-sm p-4 md:p-6 text-center relative z-40 mb-[-50px]">
        <h3 className="text-white/80 font-bold uppercase tracking-widest text-[10px] mb-1">
          Result
        </h3>
        <div className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter">
          +{result.score} points
        </div>
        <div className="flex justify-center gap-6 border-t border-white/20 pt-3">
          <div className="text-center">
            <span className="block text-white/60 text-[9px] font-black uppercase">Distance</span>
            <span className="text-white font-bold text-lg">
              {Math.abs(Math.round(result.distanceFromTarget ?? 0))}%
            </span>
          </div>
          <div className="text-center">
            <span className="block text-white/60 text-[9px] font-black uppercase">Accuracy</span>
            <span className="text-white font-bold text-lg">{getAccuracyLabel(result.score)}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full flex flex-col items-center pt-16 md:pt-20">
        <div className="relative w-[280px] h-[140px] md:w-[400px] md:h-[200px] overflow-hidden">
          <div className="absolute inset-0 spectrum-arc"></div>

          {/* Target Needle (Green) */}
          <div
            className="marker-container"
            style={{ transform: `rotate(${targetAngle}deg)`, zIndex: 25 }}
          >
            <div className="marker-needle bg-emerald-500">
              <div className="marker-dot"></div>
            </div>
          </div>

          <div
            className="marker-container"
            style={{ transform: `rotate(${yourAngle}deg)`, zIndex: 26 }}
          >
            <div className="marker-needle bg-amber-400">
              <div className="marker-dot"></div>
            </div>
          </div>
          <div
            className="marker-container"
            style={{ transform: `rotate(${redditAngle}deg)`, zIndex: 24 }}
          >
            <div className="marker-needle bg-sky-400">
              <div className="marker-dot"></div>
            </div>
          </div>

          <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-24 h-24 md:w-32 md:h-32 bg-slate-800 rounded-full border-[10px] border-white z-30 shadow-2xl flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="mt-6 flex gap-4 justify-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-lg"></div>
            <span className="text-white font-bold text-xs">You</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-lg"></div>
            <span className="text-white font-bold text-xs">Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 border-2 border-white shadow-lg"></div>
            <span className="text-white font-bold text-xs">Reddit</span>
          </div>
        </div>
      </div>

      {/* Next Button */}
      <div className="w-full max-w-sm mt-6 px-2">
        <button
          onClick={onNext}
          className="chunky-button-yellow w-full py-3.5 md:py-4 rounded-3xl flex items-center justify-center gap-2 group"
        >
          <span className="text-xl md:text-2xl font-black uppercase tracking-tight text-amber-950">
            {isLastRound ? 'View Results' : 'Next Round'}
          </span>
          <span className="material-symbols-outlined text-2xl md:text-3xl text-amber-950 group-hover:translate-x-1 transition-transform">
            arrow_forward_ios
          </span>
        </button>
      </div>
    </div>
  );
};
