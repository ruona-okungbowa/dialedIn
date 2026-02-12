import { useState, FormEvent } from 'react';
import { exitExpandedMode } from '@devvit/web/client';

import type { SpectrumLabSubmitRequest, SpectrumLabSubmitResponse } from '../../shared/types/api';

export const SpectrumLabScreen = () => {
  const [leftLabel, setLeftLabel] = useState('');
  const [rightLabel, setRightLabel] = useState('');

  const [clue1Text, setClue1Text] = useState('');
  const [clue2Text, setClue2Text] = useState('');
  const [clue3Text, setClue3Text] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedLeft = leftLabel.trim();
    const trimmedRight = rightLabel.trim();
    const trimmedClue1 = clue1Text.trim();
    const trimmedClue2 = clue2Text.trim();
    const trimmedClue3 = clue3Text.trim();

    if (!trimmedLeft || !trimmedRight) {
      setError('Please add both left and right labels for your spectrum.');
      return;
    }

    if (!trimmedClue1 || !trimmedClue2 || !trimmedClue3) {
      setError('Please add all three clues for your spectrum.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body: SpectrumLabSubmitRequest = {
        leftLabel: trimmedLeft,
        rightLabel: trimmedRight,
        sampleClue: trimmedClue1, // For backwards compatibility, send first clue
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

      (await res.json()) as SpectrumLabSubmitResponse;

      setLeftLabel('');
      setRightLabel('');
      setClue1Text('');
      setClue2Text('');
      setClue3Text('');

      // Show success message
      setSuccessMessage('Submission Sent! Your spectrum is now pending review.');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex h-full w-full flex-col items-center overflow-hidden py-4 md:py-8 px-4 md:px-6"
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

      <main className="relative z-10 w-full max-w-2xl h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center mb-4 md:mb-6 flex-shrink-0">
          <h1 className="text-white font-black text-3xl md:text-5xl lg:text-6xl tracking-tighter uppercase italic drop-shadow-lg">
            Create a Spectrum
          </h1>
          <p className="text-white/80 font-bold text-sm md:text-lg tracking-wide uppercase mt-2">
            Submit your idea to the community
          </p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="pb-4 md:pb-6">
            {/* Form Card */}
            <div
              className="w-full p-4 md:p-6 lg:p-8 xl:p-12 flex flex-col gap-4 md:gap-6 lg:gap-8"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                borderRadius: '2rem',
              }}
            >
              {/* Preview Dial */}
              <div className="flex flex-col items-center">
                <div className="relative w-64 md:w-72 lg:w-80 h-32 md:h-36 lg:h-40 overflow-hidden mb-3 md:mb-4">
                  <div
                    className="absolute inset-0 opacity-90 shadow-inner"
                    style={{
                      background:
                        'conic-gradient(from 270deg at 50% 100%, #2dd4bf, #fbbf24, #f97316, #ef4444)',
                      mask: 'radial-gradient(circle at 50% 100%, transparent 55%, black 56%)',
                      WebkitMask: 'radial-gradient(circle at 50% 100%, transparent 55%, black 56%)',
                      borderRadius: '999px 999px 0 0',
                    }}
                  />
                  <div className="absolute bottom-0 w-full h-1 bg-white/20" />
                </div>
                <div className="flex justify-between w-64 md:w-72 lg:w-80 text-white font-black uppercase text-xs tracking-widest px-1">
                  <span className="truncate max-w-[45%]">{leftLabel || 'Left'}</span>
                  <span className="truncate max-w-[45%] text-right">{rightLabel || 'Right'}</span>
                </div>
              </div>

              {/* Form Fields */}
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 lg:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-white/70 font-bold text-xs md:text-sm uppercase tracking-widest ml-1">
                      Left Label
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-sm md:text-base lg:text-lg transition-all focus:shadow-[0_0_15px_rgba(255,255,255,0.4)] focus:border-white focus:outline-none"
                      placeholder="e.g. Cold"
                      type="text"
                      value={leftLabel}
                      onChange={(e) => setLeftLabel(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-white/70 font-bold text-xs md:text-sm uppercase tracking-widest ml-1">
                      Right Label
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/20 rounded-2xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-sm md:text-base lg:text-lg transition-all focus:shadow-[0_0_15px_rgba(255,255,255,0.4)] focus:border-white focus:outline-none"
                      placeholder="e.g. Hot"
                      type="text"
                      value={rightLabel}
                      onChange={(e) => setRightLabel(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                </div>

                {/* Clues Section */}
                <div className="space-y-3 md:space-y-4 border-t border-white/10 pt-4 md:pt-6 lg:pt-8">
                  {/* Clue 1 */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[#fbbf24] font-black text-xs uppercase tracking-[0.2em] ml-1">
                      Clue 1
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/10 rounded-xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-sm md:text-base transition-all focus:shadow-[0_0_15px_rgba(255,255,255,0.4)] focus:border-white focus:outline-none"
                      placeholder="Enter first clue..."
                      type="text"
                      value={clue1Text}
                      onChange={(e) => setClue1Text(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Clue 2 */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[#f472b6] font-black text-xs uppercase tracking-[0.2em] ml-1">
                      Clue 2
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/10 rounded-xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-sm md:text-base transition-all focus:shadow-[0_0_15px_rgba(255,255,255,0.4)] focus:border-white focus:outline-none"
                      placeholder="Enter second clue..."
                      type="text"
                      value={clue2Text}
                      onChange={(e) => setClue2Text(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Clue 3 */}
                  <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[#2dd4bf] font-black text-xs uppercase tracking-[0.2em] ml-1">
                      Clue 3
                    </label>
                    <input
                      className="w-full bg-white/10 border-2 border-white/10 rounded-xl p-3 md:p-4 text-white placeholder-white/30 font-bold text-sm md:text-base transition-all focus:shadow-[0_0_15px_rgba(255,255,255,0.4)] focus:border-white focus:outline-none"
                      placeholder="Enter third clue..."
                      type="text"
                      value={clue3Text}
                      onChange={(e) => setClue3Text(e.target.value)}
                      maxLength={50}
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-indigo-900/40 p-4 md:p-5 rounded-2xl flex items-start gap-3 border border-indigo-400/30">
                  <span className="material-symbols-outlined text-[#fbbf24] text-xl md:text-2xl flex-shrink-0">
                    stars
                  </span>
                  <p className="text-white/90 text-xs md:text-sm font-semibold leading-snug">
                    Top-voted community spectrums are auto-approved. Creators are credited in-game!
                  </p>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-2.5 md:p-3 lg:p-4">
                    <p className="text-red-200 text-xs md:text-sm lg:text-base font-medium">
                      {error}
                    </p>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-teal-500/20 border border-teal-400/50 rounded-2xl p-2.5 md:p-3 lg:p-4">
                    <p className="text-teal-200 text-xs md:text-sm lg:text-base font-medium">
                      {successMessage}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3 md:gap-4 pt-4 md:pt-6 lg:pt-10">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 md:py-5 lg:py-6 rounded-3xl flex items-center justify-center gap-2 md:gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: '#fbbf24',
                      boxShadow: '0 8px 0px #d97706',
                    }}
                    onMouseDown={(e) => {
                      if (!submitting) {
                        e.currentTarget.style.transform = 'translateY(4px)';
                        e.currentTarget.style.boxShadow = '0 4px 0px #d97706';
                      }
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '0 8px 0px #d97706';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '0 8px 0px #d97706';
                    }}
                  >
                    <span className="text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800">
                      {submitting ? 'Submitting...' : 'Submit to Reddit'}
                    </span>
                    <span className="material-symbols-outlined text-2xl md:text-3xl text-slate-800">
                      forum
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      try {
                        await exitExpandedMode(e.nativeEvent);
                      } catch (error) {
                        console.error('Failed to exit expanded mode:', error);
                      }
                    }}
                    className="w-full py-4 md:py-5 rounded-3xl flex items-center justify-center gap-2 md:gap-3 text-center text-white font-black uppercase text-base md:text-lg lg:text-xl tracking-widest border-3 border-white transition-all hover:bg-white/10 hover:scale-[1.02]"
                    style={{ border: '3px solid white' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
