import React, { useState, useEffect, useRef } from 'react';
import { User, Building2, Sparkles, Download } from 'lucide-react';
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
      if (data.prize) return data.prize;
    }
    return null;
  } catch (e) {
    console.error("API Error:", e);
    return null;
  }
};

export default function App() {
  const [view, setView] = useState('login'); // 'login', 'playing_action', 'result' (Unified)
  const [companies, setCompanies] = useState<string[]>(FALLBACK_COMPANIES);
  const isMaintenance = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

  const [formData, setFormData] = useState({ name: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState('');

  // Scratch Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratched, setIsScratched] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Celebration (Only fires when scratched)
  useEffect(() => {
    if (view === 'result' && isScratched) {
      const duration = 5000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [view, isScratched]);

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
      setView('result'); // Switch to Unified Result View
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
      const assignedPrize = await assignPrize(formData.name.trim(), formData.company);
      if (!assignedPrize || assignedPrize.startsWith("DEBUG:")) {
        setLoading(false);
        alert("找不到該姓名，請重新輸入！");
        return;
      }

      setPrize(assignedPrize);
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

  // Canvas Logic (Run once when view becomes result)
  useEffect(() => {
    if (view === 'result' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Initial Draw
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ce1126';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#fcd34d';
      for (let i = 0; i < 80; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const img = new Image();
      img.src = "https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/a466e6dbb78746f9f4448c643eb82d47-removebg-preview.png";

      const finishDraw = () => {
        const aspect = img.width / img.height;
        let drawWidth = Math.min(canvas.width * 0.6, 400);
        let drawHeight = drawWidth / aspect;
        const x = (canvas.width - drawWidth) / 2;
        const y = (canvas.height - drawHeight) / 2;
        ctx.drawImage(img, x, y, drawWidth, drawHeight);

        ctx.font = 'bold 36px "Noto Serif TC", serif';
        ctx.fillStyle = '#fcd34d';
        ctx.textAlign = 'center';
        ctx.fillText("請刮出你的中獎結果", canvas.width / 2, y + drawHeight + 80);
        ctx.globalCompositeOperation = 'destination-out';
      };

      if (img.complete) finishDraw();
      else img.onload = finishDraw;

      // Interaction
      let isDrawing = false;
      let moveCount = 0;
      const getPos = (e: MouseEvent | TouchEvent) => {
        // ... (Simple pos logic)
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

        if (!isScratched && moveCount > 5) {
          // Check transparency periodically
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          let transparent = 0;
          const sampleRate = 32;
          for (let i = 3; i < imageData.data.length; i += 4 * sampleRate) {
            if (imageData.data[i] === 0) transparent++;
          }
          if ((transparent / (imageData.data.length / 4 / sampleRate)) > 0.35) {
            setIsScratched(true); // Trigger fade out
          }
        }
      };

      const start = (e: any) => { isDrawing = true; const p = getPos(e); scratch(p.x, p.y); };
      const move = (e: any) => { if (isDrawing) { e.preventDefault(); const p = getPos(e); scratch(p.x, p.y); } };
      const end = () => isDrawing = false;

      canvas.addEventListener('mousedown', start);
      canvas.addEventListener('mousemove', move);
      canvas.addEventListener('mouseup', end);
      canvas.addEventListener('touchstart', start, { passive: false });
      canvas.addEventListener('touchmove', move, { passive: false });
      canvas.addEventListener('touchend', end);
    }
  }, [view]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-serif text-white">
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

      {/* Dark Overlay */}
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-1000 z-10 ${view === 'login' ? 'opacity-100' : 'opacity-0'}`} />

      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 animate-fade-in">
          {/* ... Login Form omitted for brevity but kept in mind ... */}
          {/* Full Login Form Re-implementation */}
          <div className="w-full max-w-md bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/20 relative group">
            <a href="/api/export_signups" download className="absolute top-2 right-2 p-2 text-white/5 hover:text-yellow-500 transition-colors">
              <Download className="w-4 h-4" />
            </a>
            <div className="text-center mb-8">
              <img src="https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/a466e6dbb78746f9f4448c643eb82d47-removebg-preview.png" className="w-full max-w-[280px] mx-auto mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] object-contain" />
              <p className="text-yellow-100/80">今日好運攏總來</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Name input */}
              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">中文姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input required name="name" type="text" placeholder="例如: 王小明" className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white font-serif" value={formData.name} onChange={handleInputChange} />
                </div>
              </div>
              {/* Company Select */}
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

      {/* UNIFIED RESULT VIEW (Only visible when view === 'result') */}
      {view === 'result' && (
        <div className="relative z-40 h-full w-full flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
          {/* THE FINAL CARD (Always rendered underneath) */}
          <div className="bg-black/95 backdrop-blur-xl p-8 rounded-3xl border border-yellow-500 shadow-[0_0_100px_rgba(234,179,8,0.6)] max-w-lg w-full relative overflow-hidden">

            {/* Spinning Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(234,179,8,0.2)_180deg,transparent_360deg)] animate-[spin_10s_linear_infinite] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-3xl font-bold text-yellow-500 mb-4 tracking-wider">恭喜中獎</h2>

              {/* Prize Box with Newline Support */}
              <div className="w-full bg-gradient-to-br from-red-900/90 to-red-950/90 p-6 rounded-2xl border border-red-500/50 my-6 shadow-inner transform hover:scale-[1.02] transition-transform">
                <p className="text-red-200 text-sm mb-2 tracking-widest">CHINESE NEW YEAR 2026</p>
                <div className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 w-full leading-normal drop-shadow-sm pb-1 flex flex-col gap-1">
                  {prize.split('\n').map((line, idx) => (
                    <span key={idx}>{line}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <p className="text-white text-lg font-bold">{formData.name}</p>
                <p className="text-yellow-500/80 text-sm">{formData.company}</p>
              </div>

              <button onClick={() => window.location.reload()} className="mt-2 px-8 py-2 rounded-full border border-yellow-500/30 text-yellow-500/60 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all text-sm mb-6 pointer-events-auto z-50">
                返回首頁
              </button>

              <div className="w-full bg-yellow-900/30 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-yellow-200 text-sm font-bold">⚠️ 請務必保留此截圖</p>
                <p className="text-gray-300 text-xs mt-1">活動結束後，請向 <span className="text-yellow-400 font-bold">福委會</span> 出示以領取獎項。</p>
              </div>
            </div>
          </div>

          {/* SCRATCH OVERLAY (Absolute on top) */}
          {/* Transition opacity based on isScratched */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full cursor-pointer touch-none z-50 transition-opacity duration-1000 
                  ${isScratched ? 'opacity-0 pointer-events-none' : 'opacity-100'}
                  bg-[#ce1126]`} // Initial Red BG to prevent flash
          />
        </div>
      )}

      {/* Global Styles */}
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
