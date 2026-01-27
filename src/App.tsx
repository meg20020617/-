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
    // Logic remains: Compare Company then Chinese Name
    const res = await fetch(`/api/winner?name=${encodeURIComponent(name)}&company=${encodeURIComponent(company)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.prize) return data.prize;
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

  // Added englishName
  const [formData, setFormData] = useState({ name: '', englishName: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState('');

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
      // High Z-Index + Origin from Top
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      // Immediate blast
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
      // Comparison Logic: Still uses Chinese Name + Company
      const assignedPrize = await assignPrize(formData.name.trim(), formData.company);
      if (!assignedPrize || assignedPrize.startsWith("DEBUG:")) {
        setLoading(false);
        alert("找不到該姓名，請重新輸入！");
        return;
      }

      setPrize(assignedPrize);
      // Submit includes English Name now
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

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const dpr = window.devicePixelRatio || 1;
      // Use max screen size to be safe against address bar collapse
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      // Scale context to ensure drawing operations use logical pixels but render at high DPI
      ctx.scale(dpr, dpr);

      // Init Draw using logical dimensions (window.innerWidth/Height)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ce1126';
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight); // logical size

      ctx.fillStyle = '#fcd34d';
      for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        // Use logical dimensions
        ctx.arc(Math.random() * window.innerWidth, Math.random() * window.innerHeight, Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const img = new Image();
      // Logo on Scratch Card (Cover) remains same? Or should update?
      // User said "Lion logo all change to this". So I update here too.
      img.src = logoUrl;

      const finishDraw = () => {
        const aspect = img.width / img.height;
        // Logical width
        let drawWidth = Math.min(window.innerWidth * 0.5, 300); // Slightly smaller since new logo might be different ratio
        let drawHeight = drawWidth / aspect;
        const x = (window.innerWidth - drawWidth) / 2;
        const y = (window.innerHeight - drawHeight) / 2;
        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        // Dynamic Font Size for Mobile - Larger and Wider
        const fontSize = Math.min(window.innerWidth * 0.08, 42);
        ctx.font = `bold ${fontSize}px "Noto Serif TC", serif`;
        ctx.fillStyle = '#fcd34d';
        ctx.textAlign = 'center';
        // Add letter spacing (Increased to 20px)
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

        // AGGRESSIVE FIREWORKS TRIGGER
        // Fire on 10th move
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
    <div className="relative w-full h-[100dvh] bg-black overflow-hidden font-serif text-white touch-none overscroll-none">
      <video
        ref={videoRef}
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        src="https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E7%9B%B4%E5%BC%8F%E6%8A%BD%E7%8D%8E%E5%B0%81%E9%9D%A2%E5%8B%95%E6%85%8B.mp4"
        playsInline
        autoPlay
        muted={false}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />

      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-1000 z-10 ${view === 'login' ? 'opacity-100' : 'opacity-0'}`} />

      {view === 'login' && (
        <div className="relative z-20 flex flex-col items-center justify-center h-full animate-fade-in">
          {/* Reduced Width Container (90%) */}
          <div className="w-[90%] max-w-md bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/20 relative group">
            <a href="/api/export_signups" download className="absolute top-2 right-2 p-2 text-white/5 hover:text-yellow-500 transition-colors">
              <Download className="w-4 h-4" />
            </a>
            <div className="text-center mb-6">
              <img src={logoUrl} className="w-full max-w-[200px] mx-auto mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] object-contain" />
              {/* Removed '今日好運攏總來' */}
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">中文姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input required name="name" type="text" placeholder="例如: 王小明" className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white font-serif" value={formData.name} onChange={handleInputChange} />
                </div>
              </div>

              {/* Added English Name Input */}
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

      {/* RESULT VIEW - FULL SCREEN BLACK COVER */}
      {
        view === 'result' && (
          // Fixed Wrapper to ensure it covers EVERYTHING
          <div className="fixed inset-0 z-40 flex flex-col bg-black text-center animate-fade-in-up">

            {/* Flex Container for Content */}
            <div className="relative w-full h-full flex flex-col z-10">

              {/* Top/Middle Content - Auto scrollable if needed */}
              <div className="flex-1 w-[90%] mx-auto flex flex-col items-center justify-center overflow-y-auto">

                {/* Added Logo to Result top */}
                <img src={logoUrl} className="w-[120px] mb-6 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />

                <h2 className="text-4xl md:text-6xl font-extrabold text-yellow-400 mb-6 tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] shrink-0">
                  恭喜中獎
                </h2>

                {/* Prize Text - Huge */}
                <div className="w-full my-4 shrink-0">
                  <div className="text-4xl md:text-5xl font-black text-white w-full leading-snug drop-shadow-sm pb-1 flex flex-col items-center gap-3">
                    {prize.split('|||').map((line, idx) => (
                      <span key={idx} className="block">{line}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 mt-6 shrink-0">
                  <p className="text-yellow-100 text-3xl font-bold">{formData.name}</p>
                  <p className="text-yellow-500/80 text-xl">{formData.company}</p>
                </div>
              </div>

              {/* Bottom Footer - Sticky at bottom */}
              <div className="w-full p-6 pb-12 shrink-0 flex justify-center bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                {/* Reduced font size of reminder to smaller text-base/text-sm to match/be smaller than Company Name */}
                <div className="w-[90%] max-w-md bg-yellow-900/40 border border-yellow-500/30 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-white font-bold text-base leading-relaxed tracking-wide">
                    請截圖此畫面<br />
                    活動結束後請向<span className="text-yellow-400">福委會</span>出示截圖以領取獎項
                  </p>
                </div>
              </div>

            </div>

            {/* SCRATCH OVERLAY - FULL SCREEN */}
            {/* Fixed ensures it stays on screen even if parent flex has issues, causing overlap correctly */}
            <canvas
              ref={canvasRef}
              className={`fixed inset-0 w-full h-full cursor-pointer touch-none z-50 transition-colors duration-300 
                     ${isCanvasReady ? 'bg-transparent' : 'bg-[#ce1126]'}`}
            />
          </div>
        )
      }

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .font-serif { font-family: "Noto Serif TC", "Songti TC", serif; }
      `}</style>
    </div>
  );
}
