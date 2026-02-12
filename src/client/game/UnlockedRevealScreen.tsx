import { useState } from 'react';
import type { GuessResult } from '../../shared/types';
import { useSoundHaptics } from '../hooks/useSoundHaptics';

type UnlockedRevealScreenProps = {
  results: GuessResult[];
  onComplete: () => void;
};

export const UnlockedRevealScreen = ({ results, onComplete }: UnlockedRevealScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { playSound, triggerHapticFeedback } = useSoundHaptics();

  // Total slides = 3 rounds + 1 final score screen
  const totalSlides = results.length + 1;
  const isOnFinalSlide = currentSlide === results.length;

  const handleNext = () => {
    if (isOnFinalSlide) {
      playSound('success');
      triggerHapticFeedback([20, 30, 20]);
      onComplete();
    } else {
      playSound('dial-move');
      triggerHapticFeedback(10);
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      playSound('dial-move');
      triggerHapticFeedback(10);
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const minAngle = -90;
  const maxAngle = 90;

  const valueToAngle = (value: number): number => {
    return minAngle + (value / 100) * (maxAngle - minAngle);
  };

  const getAccuracyLabel = (score: number): string => {
    if (score >= 90) return 'Perfect!';
    if (score >= 80) return 'Great!';
    if (score >= 70) return 'Good!';
    if (score >= 60) return 'Close!';
    return 'Off';
  };

  const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);

  // Render individual round reveal
  const renderRoundReveal = (result: GuessResult, roundIndex: number) => {
    const targetAngle = valueToAngle(result.target);
    const yourAngle = valueToAngle(result.dialValue);
    const redditAngle = valueToAngle(result.redditAverage);

    return (
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center px-4 sm:px-6">
        {/* Round Header */}
        <div className="mb-2 sm:mb-2 text-center">
          <h2 className="text-white font-black text-xl sm:text-2xl uppercase tracking-tight">
            Round {roundIndex + 1} Results
          </h2>
          <p className="text-white/70 text-xs sm:text-sm font-medium mt-0.5">
            Unlocked! Here's how you did.
          </p>
        </div>

        {/* Score Card */}
        <div className="glass-results w-full max-w-sm p-3 sm:p-4 text-center relative z-40 mb-[-32px] sm:mb-[-35px]">
          <h3 className="text-white/80 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] mb-0.5">
            Result
          </h3>
          <div className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tighter">
            +{result.score} points
          </div>
          <div className="flex justify-center gap-4 sm:gap-5 border-t border-white/20 pt-2">
            <div className="text-center">
              <span className="block text-white/60 text-[8px] sm:text-[9px] font-black uppercase">
                Distance
              </span>
              <span className="text-white font-bold text-base sm:text-lg">
                {Math.abs(Math.round(result.distanceFromTarget ?? 0))}%
              </span>
            </div>
            <div className="text-center">
              <span className="block text-white/60 text-[8px] sm:text-[9px] font-black uppercase">
                Accuracy
              </span>
              <span className="text-white font-bold text-base sm:text-lg">
                {getAccuracyLabel(result.score)}
              </span>
            </div>
          </div>
        </div>

        {/* Dial Visualization */}
        <div className="relative w-full flex flex-col items-center pt-9 sm:pt-10">
          <div className="relative w-[220px] h-[110px] sm:w-[260px] sm:h-[130px] overflow-hidden">
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

            {/* Your Needle (Yellow) */}
            <div
              className="marker-container"
              style={{ transform: `rotate(${yourAngle}deg)`, zIndex: 26 }}
            >
              <div className="marker-needle bg-amber-400">
                <div className="marker-dot"></div>
              </div>
            </div>

            {/* Reddit Average Needle (Blue) */}
            <div
              className="marker-container"
              style={{ transform: `rotate(${redditAngle}deg)`, zIndex: 24 }}
            >
              <div className="marker-needle bg-sky-400">
                <div className="marker-dot"></div>
              </div>
            </div>

            {/* Center Hub */}
            <div className="absolute bottom-[-28px] sm:bottom-[-30px] left-1/2 -translate-x-1/2 w-20 h-20 sm:w-22 sm:h-22 bg-slate-800 rounded-full border-[8px] sm:border-[10px] border-white z-30 shadow-2xl flex items-center justify-center">
              <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-2.5 sm:mt-3 flex gap-3 sm:gap-4 justify-center flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-lg"></div>
              <span className="text-white font-bold text-xs sm:text-sm">You</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-lg"></div>
              <span className="text-white font-bold text-xs sm:text-sm">Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-sky-400 border-2 border-white shadow-lg"></div>
              <span className="text-white font-bold text-xs sm:text-sm">Reddit Avg</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render final score summary
  const renderFinalScore = () => {
    return (
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center px-4 sm:px-6">
        {/* Header */}
        <div className="mb-2.5 sm:mb-3 text-center">
          <div className="flex justify-center items-center gap-2 mb-1">
            <span
              className="material-symbols-outlined text-yellow-400 text-2xl sm:text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
            <h2 className="text-white font-black text-2xl sm:text-3xl uppercase tracking-tight">
              Final Score
            </h2>
            <span
              className="material-symbols-outlined text-yellow-400 text-2xl sm:text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
          </div>
          <p className="text-white/80 text-xs sm:text-sm font-medium">All rounds complete!</p>
        </div>

        {/* Total Score Card */}
        <div className="glass-card w-full max-w-md p-4 sm:p-5 text-center mb-3 sm:mb-4">
          <p className="text-white/70 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-1">
            Total Score
          </p>
          <div
            className="text-yellow-400 font-black text-5xl sm:text-6xl leading-none mb-2"
            style={{ textShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }}
          >
            {totalScore.toLocaleString()}
          </div>
          <p className="text-white/90 text-xs sm:text-sm font-medium italic">
            You've dialed in for today!
          </p>
        </div>

        {/* Round Breakdown */}
        <div className="w-full max-w-md space-y-1.5 sm:space-y-2">
          {results.map((result, idx) => (
            <div
              key={idx}
              className="bg-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10 flex items-center justify-between"
            >
              <span className="text-white/70 font-bold text-xs sm:text-sm uppercase">
                Round {idx + 1}
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="text-white/60 text-[10px] sm:text-xs">
                  {Math.abs(Math.round(result.distanceFromTarget ?? 0))}% off
                </div>
                <div className="text-white font-bold text-sm sm:text-base">{result.score} pts</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-gradient-purple-pink">
      <div className="fixed inset-0 vibrant-pattern pointer-events-none"></div>
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-teal-400/20 rounded-full blur-[80px]"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-500/20 rounded-full blur-[80px]"></div>

      {/* Progress Indicator */}
      <div className="relative z-10 w-full max-w-md mx-auto pt-3 sm:pt-3.5 pb-2 px-4 flex-shrink-0">
        <div className="flex justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1 sm:h-1.5 rounded-full transition-all ${
                idx === currentSlide
                  ? 'w-10 sm:w-12 bg-yellow-400'
                  : idx < currentSlide
                    ? 'w-6 sm:w-8 bg-teal-400'
                    : 'w-6 sm:w-8 bg-white/20'
              }`}
            ></div>
          ))}
        </div>
        <p className="text-center text-white/60 text-[10px] sm:text-xs font-bold mt-1 uppercase tracking-wider">
          {isOnFinalSlide ? 'Final Score' : `Round ${currentSlide + 1} of ${results.length}`}
        </p>
      </div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full overflow-hidden">
        {isOnFinalSlide
          ? renderFinalScore()
          : renderRoundReveal(results[currentSlide]!, currentSlide)}
      </main>

      {/* Navigation Buttons */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4 pb-4 sm:pb-5 pt-2 sm:pt-2.5 space-y-2 flex-shrink-0">
        <button
          onClick={handleNext}
          className="chunky-button-yellow w-full py-1.5 sm:py-2 rounded-2xl sm:rounded-3xl flex items-center justify-center gap-2 group"
        >
          <span className="text-lg sm:text-xl font-black uppercase tracking-tight text-amber-950">
            {isOnFinalSlide ? 'View Dashboard' : 'Next'}
          </span>
          <span className="material-symbols-outlined text-xl sm:text-2xl text-amber-950 group-hover:translate-x-1 transition-transform">
            arrow_forward_ios
          </span>
        </button>

        {currentSlide > 0 && (
          <button
            onClick={handlePrevious}
            className="chunky-button-secondary w-full py-2 sm:py-2 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl text-slate-700">
              arrow_back_ios
            </span>
            <span className="text-sm sm:text-base font-bold uppercase tracking-tight text-slate-700">
              Previous
            </span>
          </button>
        )}
      </div>

      {/* Bottom Glow */}
      <div className="fixed bottom-0 left-0 w-full h-1/4 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};
