import { useState, useCallback } from 'react';

type OnboardingScreenProps = {
  onComplete: () => void;
};

type TutorialStep = 'intro' | 'drag' | 'submit' | 'reveal' | 'done';

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [step, setStep] = useState<TutorialStep>('intro');
  const [dialValue, setDialValue] = useState(50);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Tutorial uses a simple, universally understood spectrum
  const tutorialSpectrum = {
    leftLabel: 'Cold',
    rightLabel: 'Hot',
  };

  const tutorialClue = 'A Cup of Coffee';
  const tutorialTarget = 72; // Coffee is fairly hot

  const handleDialChange = useCallback(
    (value: number) => {
      setDialValue(value);
      if (!hasInteracted) setHasInteracted(true);
    },
    [hasInteracted]
  );

  const handleSubmit = () => {
    setStep('reveal');
  };

  const score = Math.round(100 * (1 - Math.pow(Math.abs(dialValue - tutorialTarget) / 50, 2)));

  if (step === 'intro') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="fixed inset-0 pointer-events-none vibrant-pattern" />
        <h1 className="text-white font-black text-4xl md:text-5xl uppercase tracking-tighter mb-4 relative z-10">
          Let's Practice!
        </h1>
        <p className="text-white/80 text-base md:text-lg font-medium mb-8 max-w-md relative z-10">
          You'll see a spectrum with two opposites. Place a clue on the spectrum where you think it
          belongs.
        </p>
        <button
          onClick={() => setStep('drag')}
          className="chunky-button px-8 py-4 rounded-2xl text-xl font-black uppercase text-amber-950 relative z-10"
        >
          Try It Now
        </button>
        <button
          onClick={onComplete}
          className="text-white/40 text-sm font-bold uppercase tracking-widest mt-4 relative z-10"
        >
          Skip — I know how to play
        </button>
      </div>
    );
  }

  if (step === 'drag' || step === 'submit') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 relative">
        <div className="fixed inset-0 pointer-events-none vibrant-pattern" />

        {/* Tooltip overlay */}
        {!hasInteracted && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-slate-900 px-4 py-2 rounded-xl font-bold text-sm animate-bounce">
            👆 Drag the dial to place "A Cup of Coffee"
          </div>
        )}

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
          {/* Spectrum labels */}
          <div className="flex justify-between w-full max-w-sm mb-2 px-4">
            <span className="text-cyan-300 font-black text-sm uppercase">
              {tutorialSpectrum.leftLabel}
            </span>
            <span className="text-orange-400 font-black text-sm uppercase">
              {tutorialSpectrum.rightLabel}
            </span>
          </div>

          {/* Clue */}
          <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-2xl border-2 border-white/20 mb-6">
            <p className="text-white font-black text-xl italic">"{tutorialClue}"</p>
          </div>

          {/* Dial */}
          <div className="w-full max-w-sm mb-6">
            <input
              type="range"
              min="0"
              max="100"
              value={dialValue}
              onChange={(e) => handleDialChange(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #2dd4bf, #fbbf24, #f97316, #ef4444)`,
              }}
            />
            <div className="text-center mt-2 text-white/60 text-sm font-bold">
              Your position: {dialValue}
            </div>
          </div>

          {/* Submit button — only enabled after interaction */}
          <button
            onClick={handleSubmit}
            disabled={!hasInteracted}
            className={`chunky-button-yellow w-full max-w-sm py-4 rounded-3xl text-xl font-black uppercase text-amber-950 transition-all ${
              !hasInteracted ? 'opacity-30 cursor-not-allowed' : ''
            }`}
          >
            Lock It In!
          </button>
        </div>
      </div>
    );
  }

  if (step === 'reveal') {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 relative">
        <div className="fixed inset-0 pointer-events-none vibrant-pattern" />

        <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center">
          <h2 className="text-white font-black text-3xl uppercase tracking-tighter mb-2">
            {score >= 80 ? 'Nailed It!' : score >= 50 ? 'Not Bad!' : 'Keep Practicing!'}
          </h2>

          <div className="text-5xl font-black text-yellow-400 mb-4">+{score} pts</div>

          <div className="bg-white/10 rounded-2xl p-4 mb-6 w-full max-w-sm border border-white/10">
            <div className="flex justify-between text-xs text-white/50 font-bold uppercase mb-2">
              <span>Your Guess: {dialValue}</span>
              <span>Target: {tutorialTarget}</span>
            </div>
            <div className="text-white/70 text-sm">
              The closer your dial is to the target, the more points you earn. In the real game, the
              target shifts based on what the Reddit community thinks!
            </div>
          </div>

          <button
            onClick={onComplete}
            className="chunky-button w-full max-w-sm py-4 rounded-2xl text-xl font-black uppercase text-amber-950"
          >
            Start Playing!
          </button>
        </div>
      </div>
    );
  }

  return null;
};
