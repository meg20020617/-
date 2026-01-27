import React, { useState, useEffect, useRef } from 'react';
import { User, Building2, Download, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';

const IDLE_LOOP_END = 5.0;

// Initial fallback
const FALLBACK_COMPANIES = [
  "LEO", "Starcom", "Zenith", "Prodigious", "Digitas",
  "Performics", "MSL", "PMX", "Saatchi & Saatchi",
  "ReSources", "Publicis", "Human Resource", "Finance",
  "Administration", "Management", "Growth Intelligence",
  "Collective", "Commercial"
].sort();

const assignPrize = async (name: string, company: string) => {
  try {
    const res = await fetch(`/api/winner?name=${encodeURIComponent(name)}&company=${encodeURIComponent(company)}`);
    if (res.ok) {
      const data = await res.json();
      return data; // Returns { prize, id }
    }
    return null;
  } catch (e) {
    console.error("API Error:", e);
    return null;
  }
};

export default function App() {
  const [view, setView] = useState('login');
  const [companies, setCompanies] = useState<string[]>(FALLBACK_COMPANIES);
  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  const [formData, setFormData] = useState({ name: '', englishName: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState('');
  const [prizeId, setPrizeId] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWinningTriggered, setIsWinningTriggered] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const logoUrl = "https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/publicis_WG.png";

  useEffect(() => {
    fetch('/api/companies')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
        }
      })
      .catch(err => console.error("Failed to fetch companies:", err));
  }, []);

  // Celebration Fireworks
  useEffect(() => {
    if (view === 'result' && isWinningTriggered) {
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      confetti({ ...defaults, particleCount: 150, origin: { y: 0.6 } });

      const interval: any = setInterval(function () {
        const particleCount = 50;
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      setTimeout(() => clearInterval(interval), 5000);
      return () => clearInterval(interval);
    }
  }, [view, isWinningTriggered]);

  // PERMANENT SCROLL LOCK for Result View
  // User request: "Delete auto-unlock. Lock throughout."
  useEffect(() => {
    if (view === 'result') {
      document.body.style.overflow = 'hidden';
      // ALSO prevent touchmove on body to stop bounce
      const preventDefault = (e: Event) => e.preventDefault();
      document.body.addEventListener('touchmove', preventDefault, { passive: false });
      return () => {
        document.body.style.overflow = '';
        document.body.removeEventListener('touchmove', preventDefault);
      };
    }
  }, [view]);

  // LOGIN SCROLL LOCK? 
  // Probably better to allow scroll on login IF needed (e.g. keyboard open).
  // But centered view should fit.

  if (isMaintenance) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center font-serif">
        <h1 className="text-3xl font-bold text-yellow-500 mb-4">活動尚未開始</h1>
      </div>
    );
  }

  const handleTimeUpdate = () => {
    if (view === 'login' && videoRef.current) {
      if (videoRef.current.currentTime >= IDLE_LOOP_END) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  };

  const handleVideoEnded = () => {
    if (view === 'playing_action') {
      if (videoRef.current) videoRef.current.pause();
      setView('result');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submitSignup = async (data: typeof formData) => {
    try {
      await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) { console.error(error); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company) { alert("請選擇公司/部門"); return; }
    setLoading(true);

    try {
      const data = await assignPrize(formData.name.trim(), formData.company);

      if (!data || !data.prize || (typeof data.prize === 'string' && data.prize.startsWith("DEBUG:"))) {
        setLoading(false);
        alert("找不到該姓名，請重新輸入！");
        return;
      }

      setPrize(data.prize);
      if (data.id) setPrizeId(data.id);

      submitSignup(formData);

      setTimeout(() => {
        setLoading(false);
        setView('playing_action');
        if (videoRef.current) {
          videoRef.current.muted = false;
          videoRef.current.play().catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play();
            }
          });
        }
      }, 500);
    } catch (error) {
      setLoading(false);
      alert("請稍後再試");
    }
  };

  useEffect(() => {
    if (view === 'result' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      ctx.scale(dpr, dpr);

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ce1126';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      ctx.fillStyle = '#fcd34d';
      for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * window.innerWidth, Math.random() * window.innerHeight, Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const img = new Image();
      img.src = logoUrl;

      const finishDraw = () => {
        const aspect = img.width / img.height;
        let drawWidth = Math.min(window.innerWidth * 0.5, 300);
        let drawHeight = drawWidth / aspect;
        const x = (window.innerWidth - drawWidth) / 2;
        const y = (window.innerHeight - drawHeight) / 2;
        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        const fontSize = Math.min(window.innerWidth * 0.08, 42);
        ctx.font = `bold ${fontSize}px "Noto Serif TC", serif`;
        ctx.fillStyle = '#fcd34d';
        ctx.textAlign = 'center';
        if ('letterSpacing' in ctx) {
          (ctx as any).letterSpacing = "20px";
        }
        ctx.fillText("請刮出你的中獎結果", window.innerWidth / 2, y + drawHeight + (fontSize * 2));
        ctx.globalCompositeOperation = 'destination-out';

        setIsCanvasReady(true);
      };

      if (img.complete) finishDraw();
      else img.onload = finishDraw;

      let isDrawing = false;
      let moveCount = 0;

      const getPos = (e: MouseEvent | TouchEvent) => {
        let clientX, clientY;
        if ('changedTouches' in e) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
        }
        return { x: clientX, y: clientY };
      };

      const scratch = (x: number, y: number) => {
        ctx.beginPath();
        ctx.arc(x, y, 60, 0, Math.PI * 2);
        ctx.fill();
        moveCount++;

        if (!isWinningTriggered && moveCount > 10) {
          setIsWinningTriggered(true);
        }
      };

      const start = (e: any) => { isDrawing = true; const p = getPos(e); scratch(p.x, p.y); };
      const move = (e: any) => { if (isDrawing) { e.preventDefault(); const p = getPos(e); scratch(p.x, p.y); } };
      const end = () => { isDrawing = false; };

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('mouseup', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', end);
    }
  }, [view]);

  return (
    // Body is hard locked in useEffect, but this div container handles size
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden font-serif text-white touch-none">
      <video
        ref={videoRef}
        className="fixed top-0 left-0 w-full h-full object-contain z-0"
        src="https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E7%9B%B4%E5%BC%8F%E6%8A%BD%E7%8D%8E%E5%B0%81%E9%9D%A2%E5%8B%95%E6%85%8B.mp4"
        playsInline
        autoPlay
        muted={false}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />

      <div className={`fixed inset-0 bg-black/60 transition-opacity duration-1000 z-10 ${view === 'login' ? 'opacity-100' : 'opacity-0'}`} />

      {view === 'login' && (
        // Login View: Flex Column Center with margin-auto to be super safe
        <div className="relative z-20 w-full h-[100dvh] flex flex-col items-center justify-center p-6 animate-fade-in">
          {/* Card: my-auto forces it to vertical center even if flex fails */}
          <div className="w-[90%] max-w-md bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/20 relative group my-auto">
            <a href="/api/export_signups" download className="absolute top-2 right-2 p-2 text-white/5 hover:text-yellow-500 transition-colors">
              <Download className="w-4 h-4" />
            </a>
            <div className="text-center mb-6">
              <img src={logoUrl} className="w-full max-w-[200px] max-h-[150px] mx-auto mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] object-contain" />
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">中文姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input required name="name" type="text" placeholder="例如: 王小明" className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white font-serif" value={formData.name} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">英文姓名（請填寫Teams名稱）</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input required name="englishName" type="text" placeholder="例如: Daaming Wang" className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white font-serif" value={formData.englishName} onChange={handleInputChange} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">公司/部門</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-yellow-500 pointer-events-none" />
                  <select required name="company" className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 pr-4 text-white font-serif appearance-none" value={formData.company} onChange={handleInputChange}>
                    <option value="" disabled>請選擇公司</option>
                    {companies.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full mt-6 font-bold py-3 rounded-lg shadow-lg bg-gradient-to-r from-yellow-600 via-yellow-500  to-yellow-600 text-black">
                {loading ? '資料確認中...' : '簽到並開抽！'}
              </button>
            </form>
          </div>
        </div>
      )}

      {
        view === 'result' && (
          <div className="fixed inset-0 z-40 flex flex-col bg-black text-center animate-fade-in-up">
            <div className="relative w-full h-full flex flex-col z-10">

              {/* Content Wrapper: NO SCROLL. Center everything. */}
              <div className="flex-1 w-full flex flex-col items-center justify-center p-4">
                <div className="w-[90%] max-w-md flex flex-col items-center justify-center space-y-4">

                  {/* Tiny Logo */}
                  <img src={logoUrl} className="w-[80px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] shrink-0" />

                  {/* Tiny Title */}
                  <h2 className="text-3xl font-extrabold text-yellow-400 tracking-wider drop-shadow-md shrink-0">
                    恭喜中獎
                  </h2>

                  {/* Huge Number Ball */}
                  {prizeId && (
                    <div className="flex flex-col items-center animate-bounce-slow transform hover:scale-110 transition-transform shrink-0">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 shadow-[0_0_20px_rgba(253,224,71,0.5)] flex items-center justify-center border-4 border-yellow-100 ring-2 ring-yellow-500/30">
                        <span className="text-black font-black text-3xl font-sans drop-shadow-sm">{prizeId}</span>
                      </div>
                    </div>
                  )}

                  {/* Huge Prize Text */}
                  <div className="w-full shrink-0">
                    <div className="text-4xl md:text-5xl font-black text-white w-full leading-snug drop-shadow-sm flex flex-col items-center gap-2">
                      {prize.split('|||').map((line, idx) => (
                        <span key={idx} className="block max-w-full break-words">{line}</span>
                      ))}
                    </div>
                  </div>

                  {/* Small Name/Company */}
                  <div className="shrink-0 opacity-90">
                    <p className="text-yellow-100 text-2xl font-bold">{formData.name}</p>
                    <p className="text-yellow-500/80 text-lg">{formData.company}</p>
                  </div>
                </div>
              </div>

              {/* Footer: Tiny Reminder */}
              <div className="w-full p-4 pb-12 flex justify-center bg-transparent z-20 pointer-events-none">
                <div className="w-[90%] max-w-md bg-yellow-900/10 border border-yellow-500/5 rounded p-2 backdrop-blur-sm pointer-events-auto">
                  <p className="text-white font-bold text-[10px] leading-relaxed tracking-wide opacity-60">
                    請截圖此畫面<br />
                    活動結束後請向<span className="text-yellow-400">福委會</span>出示截圖以領取獎項
                  </p>
                </div>
              </div>

            </div>

            {/* SCRATCH OVERLAY */}
            <canvas
              ref={canvasRef}
              className={`fixed inset-0 w-full h-full z-50 transition-colors duration-300 
                     ${isCanvasReady ? 'bg-transparent pointer-events-none' : 'bg-[#ce1126] cursor-pointer touch-none'}`}
            />
          </div>
        )
      }

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-bounce-slow { animation: bounce 2s infinite; }
        .font-serif { font-family: "Noto Serif TC", "Songti TC", serif; }
      `}</style>
    </div>
  );
}
