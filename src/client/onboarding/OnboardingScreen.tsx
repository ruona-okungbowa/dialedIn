import { useState } from 'react';

type OnboardingStep = 1 | 2 | 3;

type OnboardingScreenProps = {
  onComplete: () => void;
};

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [step, setStep] = useState<OnboardingStep>(1);

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as OnboardingStep);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as OnboardingStep);
    }
  };

  return (
    <div
      className="relative flex items-center justify-center min-h-screen w-full py-4 md:py-8 px-3 md:px-6 overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="fixed bottom-0 left-0 w-full h-1/2 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -bottom-20 -left-20 w-[40rem] h-[40rem] bg-pink-500/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-20 -right-20 w-[40rem] h-[40rem] bg-cyan-500/20 rounded-full blur-[100px]" />
      </div>
      <main className="relative z-10 w-full max-w-2xl my-auto">
        {step === 1 && <Step1 onNext={handleNext} onSkip={onComplete} />}
        {step === 2 && <Step2 onNext={handleNext} onBack={handleBack} />}
        {step === 3 && <Step3 onNext={handleNext} onBack={handleBack} />}
      </main>
    </div>
  );
};

type StepProps = {
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
};

const Step1 = ({ onNext, onSkip }: StepProps) => {
  return (
    <div
      className="p-4 md:p-8 lg:p-12 text-center flex flex-col items-center"
      style={{
        background: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(25px)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.6)',
        borderRadius: '3rem',
      }}
    >
      <div className="relative w-36 md:w-56 h-18 md:h-28 mb-5 md:mb-10">
        <div
          className="w-full h-full"
          style={{
            background:
              'conic-gradient(from 270deg at 50% 100%, #2dd4bf, #fbbf24, #f97316, #ef4444)',
            mask: 'radial-gradient(circle at 50% 100%, transparent 45%, black 46%)',
            WebkitMask: 'radial-gradient(circle at 50% 100%, transparent 45%, black 46%)',
            borderRadius: '50% 50% 0 0',
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-[85%] bg-white rounded-t-full origin-bottom shadow-lg"
          style={{ transform: 'translateX(-50%) rotate(-45deg)' }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-2.5 bg-white rounded-t-full shadow-inner" />
        <div
          className="absolute -left-4 md:-left-7 top-1/2 -translate-y-1/2 bg-cyan-400 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg"
          style={{ transform: 'translateY(-50%) rotate(-15deg)' }}
        >
          <span className="text-white text-base md:text-2xl">❄️</span>
        </div>
        <div
          className="absolute -right-4 md:-right-7 top-1/2 -translate-y-1/2 bg-orange-500 p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-lg"
          style={{ transform: 'translateY(-50%) rotate(15deg)' }}
        >
          <span className="text-white text-base md:text-2xl">🔥</span>
        </div>
      </div>
      <div className="mb-4 md:mb-8">
        <h1 className="text-white text-2xl md:text-3xl lg:text-4xl mb-3 md:mb-6 leading-tight font-black uppercase tracking-tighter px-1">
          WELCOME TO THE SPECTRUM!
        </h1>
        <p className="text-white text-sm md:text-lg lg:text-xl font-medium leading-relaxed px-1 md:px-3">
          You'll be given two opposites, like <span className="text-cyan-300 font-bold">Hot</span>{' '}
          vs. <span className="text-orange-300 font-bold">Cold</span>. Your goal is to dial the
          needle to where a specific word, like{' '}
          <span className="text-[#fbbf24] font-bold italic">"Lava"</span>, sits on that spectrum.
        </p>
      </div>
      <div className="w-full flex flex-col items-center gap-3 md:gap-5">
        <button
          type="button"
          onClick={onNext}
          className="w-full max-w-sm py-3 md:py-5 rounded-2xl md:rounded-3xl group transition-all"
          style={{
            background: '#fbbf24',
            boxShadow: '0 6px 0px #d97706',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(3px)';
            e.currentTarget.style.boxShadow = '0 3px 0px #d97706';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 6px 0px #d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 6px 0px #d97706';
          }}
        >
          <span className="text-xl md:text-2xl font-black uppercase tracking-widest text-slate-900 group-hover:scale-105 inline-block transition-transform">
            Next
          </span>
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="text-white/60 hover:text-white font-bold text-sm md:text-base uppercase tracking-widest transition-colors"
        >
          Skip Tutorial
        </button>
      </div>
      <div className="flex gap-2 mt-5 md:mt-10">
        <div className="w-6 md:w-10 h-1.5 bg-white rounded-full" />
        <div className="w-1.5 md:w-2.5 h-1.5 bg-white/20 rounded-full" />
        <div className="w-1.5 md:w-2.5 h-1.5 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};

const Step2 = ({ onNext, onBack }: StepProps) => {
  return (
    <div
      className="flex flex-col p-4 md:p-8 lg:p-12 text-center"
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: '3rem',
      }}
    >
      <div className="relative w-full bg-white/10 rounded-xl md:rounded-2xl mb-3 md:mb-6 overflow-visible border border-white/10 flex items-center justify-center py-8 md:py-10 px-3 md:px-6">
        <div className="relative w-52 md:w-72 h-26 md:h-36">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                'conic-gradient(from 270deg at 50% 100%, #2dd4bf, #fbbf24, #f97316, #ef4444)',
              mask: 'radial-gradient(circle at 50% 100%, transparent 60%, black 61%)',
              WebkitMask: 'radial-gradient(circle at 50% 100%, transparent 60%, black 61%)',
            }}
          />
          <div className="absolute -bottom-6 left-0 text-white/60 font-bold text-[10px]">COLD</div>
          <div className="absolute -bottom-6 right-0 text-white/60 font-bold text-[10px] text-right">
            HOT
          </div>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-[95%] bg-white z-30 origin-bottom"
            style={{
              transform: 'translateX(-50%) rotate(-15deg)',
              boxShadow: '0 0 15px rgba(255,255,255,0.5)',
            }}
          >
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
              Target
            </div>
          </div>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-[85%] bg-[#fbbf24] rounded-t-full z-40 origin-bottom shadow-xl"
            style={{ transform: 'translateX(-50%) rotate(-8deg)' }}
          >
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="bg-[#fbbf24] text-slate-900 text-[9px] font-black px-1.5 py-0.5 rounded uppercase mb-1">
                You
              </div>
              <div className="w-0.5 h-1.5 bg-[#fbbf24]" />
            </div>
          </div>
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-[75%] bg-[#3b82f6] rounded-t-full z-20 origin-bottom shadow-lg opacity-90"
            style={{ transform: 'translateX(-50%) rotate(25deg)' }}
          >
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="bg-[#3b82f6] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase mb-1 whitespace-nowrap">
                Reddit Avg
              </div>
              <div className="w-0.5 h-1.5 bg-[#3b82f6]" />
            </div>
          </div>
        </div>
      </div>
      <h2 className="text-white font-black text-2xl md:text-3xl lg:text-4xl tracking-tighter uppercase italic mb-2 md:mb-4 leading-tight px-1">
        Tune into the Hive Mind
      </h2>
      <p className="text-white/90 text-sm md:text-base lg:text-lg font-medium leading-relaxed mb-3 md:mb-6 max-w-md mx-auto px-1">
        After you guess, you'll see the true{' '}
        <span className="text-white font-bold underline decoration-[#fbbf24] decoration-2 underline-offset-2">
          Target
        </span>{' '}
        and the{' '}
        <span className="text-white font-bold underline decoration-[#3b82f6] decoration-2 underline-offset-2">
          Reddit Average
        </span>
        . The closer you are to the center of the target, the more points you earn!
      </p>
      <div className="flex flex-col items-center gap-3 md:gap-5 mt-auto">
        <button
          type="button"
          onClick={onNext}
          className="w-full py-3 md:py-4 rounded-2xl md:rounded-3xl flex items-center justify-center gap-2 transition-all"
          style={{
            background: '#fbbf24',
            boxShadow: '0 6px 0px #d97706',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(3px)';
            e.currentTarget.style.boxShadow = '0 3px 0px #d97706';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 6px 0px #d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 6px 0px #d97706';
          }}
        >
          <span className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-800">
            Next
          </span>
          <span className="text-xl md:text-2xl text-slate-800">→</span>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-white/60 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors"
        >
          Back
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-2.5 h-1.5 bg-white/20 rounded-full" />
        <div className="w-7 h-1.5 bg-white rounded-full" />
        <div className="w-2.5 h-1.5 bg-white/20 rounded-full" />
      </div>
    </div>
  );
};

const Step3 = ({ onNext, onBack }: StepProps) => {
  return (
    <div
      className="flex flex-col p-4 md:p-8 lg:p-12 text-center"
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: '3rem',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-6">
        <div className="bg-white/10 rounded-xl md:rounded-2xl p-2 md:p-4 border border-white/20">
          <div className="text-2xl md:text-4xl mb-1">🎯</div>
          <h3 className="text-white font-bold text-sm md:text-base mb-0.5">Daily Challenges</h3>
          <p className="text-white/80 text-xs md:text-sm">
            New spectrums every day. Build your streak!
          </p>
        </div>
        <div className="bg-white/10 rounded-xl md:rounded-2xl p-2 md:p-4 border border-white/20">
          <div className="text-2xl md:text-4xl mb-1">🏆</div>
          <h3 className="text-white font-bold text-sm md:text-base mb-0.5">Compete</h3>
          <p className="text-white/80 text-xs md:text-sm">
            Climb the leaderboards and earn your spot in the Hall of Fame
          </p>
        </div>
        <div className="bg-white/10 rounded-xl md:rounded-2xl p-2 md:p-4 border border-white/20">
          <div className="text-2xl md:text-4xl mb-1">🧪</div>
          <h3 className="text-white font-bold text-sm md:text-base mb-0.5">Create</h3>
          <p className="text-white/80 text-xs md:text-sm">
            Submit your own spectrums in the Spectrum Lab
          </p>
        </div>
      </div>
      <h2 className="text-white font-black text-2xl md:text-3xl lg:text-4xl tracking-tighter uppercase italic mb-2 md:mb-4 leading-tight px-1">
        Ready to Dial It In?
      </h2>
      <p className="text-white/90 text-sm md:text-base lg:text-lg font-medium leading-relaxed mb-3 md:mb-6 max-w-md mx-auto px-1">
        Join thousands of players finding their wavelength. Every guess brings you closer to the
        hive mind!
      </p>
      <div className="flex flex-col items-center gap-3 md:gap-5 mt-auto">
        <button
          type="button"
          onClick={onNext}
          className="w-full py-3 md:py-5 rounded-2xl md:rounded-3xl flex items-center justify-center gap-2 transition-all"
          style={{
            background: '#fbbf24',
            boxShadow: '0 6px 0px #d97706',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translateY(3px)';
            e.currentTarget.style.boxShadow = '0 3px 0px #d97706';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 6px 0px #d97706';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 6px 0px #d97706';
          }}
        >
          <span className="text-xl md:text-2xl font-black uppercase tracking-widest text-slate-900">
            Let's Play!
          </span>
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-white/60 hover:text-white font-bold uppercase tracking-widest text-xs transition-colors"
        >
          Back
        </button>
      </div>
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-2.5 h-1.5 bg-white/20 rounded-full" />
        <div className="w-2.5 h-1.5 bg-white/20 rounded-full" />
        <div className="w-7 h-1.5 bg-white rounded-full" />
      </div>
    </div>
  );
};
