import React, { useState, useEffect, useRef } from 'react';
import { User, Building2, Phone, Sparkles, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

const IDLE_LOOP_END = 5.0;

const COMPANIES = [
  "LEO", "Starcom", "Zenith", "Prodigious", "Digitas",
  "Performics", "MSL", "PMX", "Saatchi & Saatchi",
  "ReSources", "Publicis", "Human Resource", "Finance",
  "Administration", "Management", "Growth Intelligence",
  "Collective", "Commercial"
].sort();

const FALLBACK_PRIZE_POOL = [
  { name: '參加獎：刮刮樂一張 (現金 200 元)', weight: 100 },
];

const assignPrize = async (name: string) => {
  try {
    const res = await fetch(`/api/winner?name=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.prize) return data.prize;
    }
  } catch (e) {
    console.error("API Error, falling back to random:", e);
  }

  const totalWeight = FALLBACK_PRIZE_POOL.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const prize of FALLBACK_PRIZE_POOL) {
    if (random < prize.weight) return prize.name;
    random -= prize.weight;
  }
  return '參加獎：現金 200 元';
};

export default function App() {
  const [view, setView] = useState('login'); // 'login', 'playing_action', 'scratch', 'result'
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchContainerRef = useRef<HTMLDivElement>(null);
  const [isScratched, setIsScratched] = useState(false);

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
      setView('scratch');
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      console.log("Signup saved to internal DB");
    } catch (error) {
      console.error("Signup Save Error", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company) {
      alert("請選擇公司/部門");
      return;
    }
    setLoading(true);

    try {
      const assignedPrize = await assignPrize(formData.name.trim());
      setPrize(assignedPrize);

      // Save data to internal DB
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
      console.error("Error:", error);
      setLoading(false);
      alert("請稍後再試");
    }
  };

  useEffect(() => {
    if (view === 'scratch' && canvasRef.current && scratchContainerRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const container = scratchContainerRef.current;

      setTimeout(() => {
        if (!container || !canvas || !ctx) return;

        setIsScratched(false);
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Draw Scratch Layer - Image
        const img = new Image();
        // Use the Lion Logo Image
        img.src = "https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/a466e6dbb78746f9f4448c643eb82d47-removebg-preview.png";

        const drawLayer = () => {
          ctx.globalCompositeOperation = 'source-over';

          // 1. Fill canvas with a solid base color to ensure opacity (Red/Gold theme)
          ctx.fillStyle = '#ce1126';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // 2. Draw pattern/border
          ctx.strokeStyle = '#fcd34d'; // Gold
          ctx.lineWidth = 4;
          ctx.strokeRect(0, 0, canvas.width, canvas.height);

          // 3. Draw the Logo centered
          const aspect = img.width / img.height;
          let drawWidth = canvas.width * 0.9; // 90% width
          let drawHeight = drawWidth / aspect;

          if (drawHeight > canvas.height * 0.9) {
            drawHeight = canvas.height * 0.9;
            drawWidth = drawHeight * aspect;
          }

          const x = (canvas.width - drawWidth) / 2;
          const y = (canvas.height - drawHeight) / 2;

          ctx.drawImage(img, x, y, drawWidth, drawHeight);

          // Reset for scratching
          ctx.globalCompositeOperation = 'destination-out';
        };

        if (img.complete) {
          drawLayer();
        } else {
          img.onload = drawLayer;
          // Fallback if image fails
          img.onerror = () => {
            ctx.fillStyle = '#C0C0C0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = '24px serif';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText("刮開", canvas.width / 2, canvas.height / 2);
            ctx.globalCompositeOperation = 'destination-out';
          };
        }
      }, 100);

      let isDrawing = false;
      let moveCount = 0;

      const getPos = (e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('changedTouches' in e) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else {
          clientX = (e as MouseEvent).clientX;
          clientY = (e as MouseEvent).clientY;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
      };

      const scratch = (x: number, y: number) => {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.fill();
        moveCount++;
      };

      const checkTransparency = () => {
        if (!ctx) return;
        if (isScratched || moveCount < 5) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        const sampleRate = 32;
        for (let i = 3; i < imageData.data.length; i += 4 * sampleRate) {
          if (imageData.data[i] === 0) transparent++;
        }
        const totalSampled = (imageData.data.length / 4) / sampleRate;

        if ((transparent / totalSampled) * 100 > 40) {
          setIsScratched(true);
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          setTimeout(() => setView('result'), 2000);
        }
      };

      const handleStart = (e: any) => { isDrawing = true; const pos = getPos(e); scratch(pos.x, pos.y); };
      const handleMove = (e: any) => { if (!isDrawing) return; e.preventDefault(); const pos = getPos(e); scratch(pos.x, pos.y); };
      const handleEnd = () => { isDrawing = false; checkTransparency(); };

      // Touch events need passive: false to prevent scrolling while scratching
      // React synthetic events don't support passive option easily, using refs
      // But we are attaching to canvasRef inside useEffect, which uses native addEventListener
      // So passive: false IS respected there.

      // Wait, in previous step I was using canvasRef.addEventListener.
      // I am keeping that logic.

      canvas.addEventListener('mousedown', handleStart);
      canvas.addEventListener('mousemove', handleMove);
      canvas.addEventListener('mouseup', handleEnd);
      canvas.addEventListener('touchstart', handleStart, { passive: false });
      canvas.addEventListener('touchmove', handleMove, { passive: false });
      canvas.addEventListener('touchend', handleEnd);

      return () => {
        canvas.removeEventListener('mousedown', handleStart);
        canvas.removeEventListener('mousemove', handleMove);
        canvas.removeEventListener('mouseup', handleEnd);
        canvas.removeEventListener('touchstart', handleStart);
        canvas.removeEventListener('touchmove', handleMove);
        canvas.removeEventListener('touchend', handleEnd);
      };
    }
  }, [view]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-serif text-white">
      {/* Background Video Layer */}
      <video
        ref={videoRef}
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        src="https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/%E7%9B%B4%E5%BC%8F%E6%8A%BD%E7%8D%8E%E5%B0%81%E9%9D%A2%E5%8B%95%E6%85%8B.mp4"
        muted={false}
        playsInline
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
      />

      {/* Overlay: Darken only during Login */}
      <div className={`absolute inset-0 bg-black/60 transition-opacity duration-1000 z-10 ${view === 'login' ? 'opacity-100' : 'opacity-0'}`} />

      {/* --- 1. Login Page --- */}
      {view === 'login' && (
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 animate-fade-in">
          <div className="w-full max-w-md bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/20 relative group">

            {/* Hidden CSV Download Link */}
            <a
              href="/api/export_signups"
              download
              className="absolute top-2 right-2 p-2 text-white/5 hover:text-yellow-500 transition-colors"
              title="下載名單"
            >
              <Download className="w-4 h-4" />
            </a>

            <div className="text-center mb-8">
              <img
                src="https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/a466e6dbb78746f9f4448c643eb82d47-removebg-preview.png"
                alt="2026 祥獅獻瑞"
                className="w-full max-w-[280px] mx-auto mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] object-contain"
              />
              <p className="text-yellow-100/80">今日好運攏總來</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">公司/部門</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-yellow-500 pointer-events-none" />
                  <select
                    required
                    name="company"
                    className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all appearance-none"
                    value={formData.company}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled className="text-gray-500">請選擇公司</option>
                    {COMPANIES.map(c => (
                      <option key={c} value={c} className="text-black">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">姓名 (請填寫 Teams 名稱)</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    required
                    name="name"
                    type="text"
                    placeholder="例如: Winnie Lo"
                    className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">電話號碼</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="0912-345-678"
                    className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 font-bold py-3 rounded-lg shadow-lg transform transition-all duration-200 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:to-yellow-400 text-black active:scale-95"
              >
                {loading ? '資料確認中...' : '簽到並開抽！'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- 2. Action View (Invisible UI, pure video) --- */}
      {view === 'playing_action' && (
        <div className="relative z-20 h-full w-full pointer-events-none" />
      )}

      {/* --- 3. Scratch Card Page (Overlay) --- */}
      {view === 'scratch' && (
        <div className="relative z-30 h-full w-full flex flex-col items-center justify-center animate-appear">
          {/* Card Area */}
          <div className="relative w-72 h-48 md:w-96 md:h-64 bg-transparent ">

            {/* Prize Underneath */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <h3 className="text-yellow-400 text-lg font-bold drop-shadow-md mb-2">恭喜獲得</h3>
              <p className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">{prize}</p>
            </div>

            {/* Canvas Overlay */}
            <div ref={scratchContainerRef} className="absolute inset-0 cursor-pointer overflow-hidden rounded-lg">
              <canvas ref={canvasRef} className="w-full h-full touch-none" />
            </div>
          </div>

          <div className="mt-24 text-center animate-pulse">
            <p className="text-yellow-200 text-xl font-bold bg-black/50 px-4 py-1 rounded-full">
              趕快刮開看看結果！
            </p>
          </div>
        </div>
      )}

      {/* --- 4. Result Page --- */}
      {view === 'result' && (
        <div className="relative z-40 h-full w-full flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{
                top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 2 + 1}s`,
                animationDelay: `${Math.random()}s`
              }} />
            ))}
          </div>

          <div className="bg-gradient-to-b from-red-900/90 to-black/90 p-8 rounded-3xl border-2 border-yellow-500 shadow-[0_0_60px_rgba(234,179,8,0.4)] max-w-lg w-full">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />

            <h2 className="text-3xl font-bold text-yellow-500 mb-2">中獎通知</h2>
            <div className="bg-red-800/50 p-6 rounded-xl border border-red-700/50 my-6">
              <p className="text-red-200 text-sm mb-1">恭喜您抽到</p>
              <p className="text-3xl md:text-4xl font-black text-white break-words">{prize}</p>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              請務必保留此截圖，並於活動結束後，<br />
              向 <span className="text-yellow-500 font-bold">福委會</span> 出示截圖以領取獎項。
            </p>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-left text-sm text-gray-400">
                <div>
                  <span className="block text-gray-600 text-xs">姓名 (Name)</span>
                  <span className="text-gray-200">{formData.name}</span>
                </div>
                <div>
                  <span className="block text-gray-600 text-xs">電話 (Phone)</span>
                  <span className="text-gray-200">{formData.phone}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-8 text-yellow-500/50 hover:text-yellow-500 text-xs"
            >
              返回首頁
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes appear { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-appear { animation: appear 0.6s ease-out; }
        .animate-slide-up { animation: slide-up 0.5s ease-out; }
        
        .font-serif {
          font-family: "Songti TC", "Noto Serif TC", "PMingLiU", "SimSun", serif;
        }
      `}</style>
    </div>
  );
}
