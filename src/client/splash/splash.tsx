import '../index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  const [isModerator, setIsModerator] = useState(false);
  const [checkingMod, setCheckingMod] = useState(true);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [loadingStreak, setLoadingStreak] = useState(true);

  useEffect(() => {
    const checkModStatus = async () => {
      try {
        const res = await fetch('/api/moderator/check');
        if (res.ok) {
          const data = await res.json();
          setIsModerator(data.isModerator);
        }
      } catch (error) {
        console.error('Failed to check moderator status:', error);
      } finally {
        setCheckingMod(false);
      }
    };

    void checkModStatus();
  }, []);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await fetch('/api/user-stats');
        if (res.ok) {
          const data = await res.json();
          if (data.stats?.streak?.current !== undefined) {
            setCurrentStreak(data.stats.streak.current);
          }
        }
      } catch (error) {
        console.error('Failed to fetch streak:', error);
      } finally {
        setLoadingStreak(false);
      }
    };

    void fetchStreak();
  }, []);

  return (
    <div className="h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none vibrant-pattern"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-400/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/20 rounded-full blur-[100px]"></div>

      {/* Mod Mode Button - Only show if user is a moderator */}
      {!checkingMod && isModerator && (
        <div className="fixed top-4 right-4 md:top-6 md:right-6 lg:top-8 lg:right-8 flex items-center gap-4 z-50">
          <button
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'moderator')}
            className="mod-mode-button h-12 md:h-14 lg:h-16 px-4 md:px-5 lg:px-6 rounded-xl md:rounded-2xl text-purple-100 flex items-center justify-center gap-2 md:gap-3 hover:scale-105 transition-all shadow-xl group"
          >
            <span className="font-bold text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] uppercase">
              Mod Mode
            </span>
          </button>
        </div>
      )}

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        <div className="w-full flex justify-center md:justify-start items-center mb-8 md:mb-12 px-4 md:px-8">
          {!loadingStreak && (
            <div className="streak-badge px-4 py-2 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-full flex items-center gap-2 md:gap-3 group cursor-default">
              <span className="material-symbols-outlined text-orange-500 text-xl md:text-2xl lg:text-3xl group-hover:scale-125 transition-transform">
                local_fire_department
              </span>
              <span className="text-white font-bold text-xs md:text-sm lg:text-base xl:text-lg tracking-widest uppercase">
                Daily Streak: <span className="text-orange-400 ml-1">{currentStreak}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center justify-center w-full">
          {/* Dial on the left */}
          <div className="flex flex-col items-center justify-center relative flex-shrink-0">
            <div className="relative w-[110px] md:w-[180px] lg:w-[250px] aspect-[1/0.6] flex flex-col items-center">
              <div className="relative w-full h-full overflow-hidden rounded-t-full physical-dial-base border-x-2 md:border-x-4 border-t-2 md:border-t-4 border-slate-200">
                <div className="absolute inset-0 bg-white/5 pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[90%] bg-[#efebe1] rounded-t-full shadow-inner flex items-end justify-center overflow-hidden">
                  <div className="absolute bottom-0 w-full h-full flex justify-center items-end">
                    <div className="spectrum-wedge absolute bottom-[-5%] w-[40%] h-[100%] bg-[#4db6ac] rotate-[-45deg] opacity-90"></div>
                    <div className="spectrum-wedge absolute bottom-[-5%] w-[35%] h-[100%] bg-[#f57c00] rotate-[-20deg] opacity-90"></div>
                    <div className="spectrum-wedge absolute bottom-[-5%] w-[30%] h-[100%] bg-[#e64a19] rotate-[5deg] opacity-90"></div>
                    <div className="spectrum-wedge absolute bottom-[-5%] w-[25%] h-[100%] bg-[#d81b60] rotate-[30deg] opacity-90"></div>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 md:w-3 h-[85%] bg-[#e64a19] rounded-full z-20 origin-bottom shadow-lg rotate-[-15deg]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 md:w-1 h-[100%] bg-white/30 rounded-full"></div>
                  </div>
                  <div className="absolute bottom-[-15px] md:bottom-[-20px] w-12 h-12 md:w-16 md:h-16 bg-[#e64a19] rounded-full z-30 shadow-2xl border-2 border-white">
                    <div className="absolute inset-0 m-auto w-2 h-2 md:w-3 md:h-3 bg-white/40 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="w-full h-3 md:h-4 bg-slate-300 rounded-b-xl shadow-md"></div>
            </div>
          </div>
          {/* Text content on the right */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-black uppercase mb-3 md:mb-4 lg:mb-6 text-white"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '0.05em',
              }}
            >
              DIAL
              <br />
              IT IN
            </h1>
            <div className="space-y-3 md:space-y-4 max-w-md">
              <div className="bg-white/10 backdrop-blur-lg p-3 md:p-4 rounded-2xl border-2 border-white/20">
                <p className="text-base md:text-lg lg:text-xl font-bold text-white mb-1 leading-tight">
                  Are you on the same <span className="text-yellow-300">Wavelength</span>
                </p>
                <p className="text-xs md:text-sm lg:text-base text-white/80 font-medium">
                  The ultimate mental frequency challenge. Find the target and lock it in!
                </p>
              </div>
              <div className="pt-2 md:pt-4 flex-col flex gap-3 md:gap-4 w-full">
                <button
                  className="chunky-button group w-full md:w-auto px-4 md:px-6 lg:px-8 py-2.5 md:py-3 lg:py-4 rounded-2xl flex items-center justify-center gap-2 md:gap-3 transition-all"
                  onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
                >
                  <span className="text-sm md:text-lg lg:text-xl font-black uppercase tracking-tight text-amber-950">
                    Test Your Wavelength
                  </span>
                  <span className="text-lg md:text-xl lg:text-2xl text-amber-950">▶</span>
                </button>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  <button
                    onClick={(e) => requestExpandedMode(e.nativeEvent, 'hof')}
                    className="secondary-menu-button py-2 px-2 md:py-2 md:px-3 rounded-xl md:rounded-2xl flex items-center justify-center gap-1 md:gap-2 text-white font-bold text-[10px] md:text-xs uppercase tracking-wider"
                  >
                    <span className="text-xs md:text-sm text-yellow-300">Hall of Fame</span>
                  </button>
                  <button
                    onClick={(e) => requestExpandedMode(e.nativeEvent, 'vote')}
                    className="secondary-menu-button  py-2 px-2 md:py-2 md:px-3 rounded-xl md:rounded-2xl flex items-center justify-center gap-1 md:gap-2 text-white font-bold text-[10px] md:text-xs uppercase tracking-wider"
                  >
                    <span className="text-xs md:text-sm text-yellow-300">Vote Spectrums</span>
                  </button>
                  <button
                    onClick={(e) => requestExpandedMode(e.nativeEvent, 'lab')}
                    className="secondary-menu-button py-2 px-2 md:py-2 md:px-3 rounded-xl md:rounded-2xl flex items-center justify-center gap-1 md:gap-2 text-white font-bold text-[10px] md:text-xs uppercase tracking-wider"
                  >
                    <span className="text-xs md:text-sm text-yellow-300">Submit Spectrum</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
