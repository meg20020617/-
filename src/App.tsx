import React, { useState, useEffect, useRef } from 'react';
// 移除所有 Firebase 引用
import { User, Building2, Phone, Sparkles, Camera, Trophy, Coins } from 'lucide-react';

// --- Google Form Configuration (Google 表單設定) ---
const GOOGLE_FORM_CONFIG = {
  // 您的表單提交網址 (結尾需為 /formResponse)
  actionURL: "https://docs.google.com/forms/d/e/1FAIpQLScRjcUETsrUZ64-vcAlkXV9z1DH4CFS0uKfXG9GihS7BiEOwA/formResponse",

  // 對應欄位 ID (從您提供的連結解析出來的)
  entryName: "entry.2098330522",    // 姓名
  entryCompany: "entry.1082621236", // 公司
  entryPhone: "entry.766012256"     // 電話
};

// --- Configuration ---
// 設定：待機循環的結束時間點 (秒)
const IDLE_LOOP_END = 5.0;

// --- 獎項資料設定 ---
// 1. 【預先匹配名單】 (已改為使用 Vercel Postgres 資料庫，請至 /api/seed 初始化)
// const PRE_MATCHED_PRIZES = { ... }; // 移除硬編碼

// 2. 【候補隨機池】
const FALLBACK_PRIZE_POOL = [
  { name: '參加獎：刮刮樂一張 (現金 200 元)', weight: 100 },
];

// Async function to check prize from API
const assignPrize = async (phoneNumber: string) => {
  try {
    const res = await fetch(`/api/winner?phone=${encodeURIComponent(phoneNumber)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.prize) return data.prize;
    }
  } catch (e) {
    console.error("API Error, falling back to random:", e);
  }

  // Fallback if no specific prize found in DB
  const totalWeight = FALLBACK_PRIZE_POOL.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const prize of FALLBACK_PRIZE_POOL) {
    if (random < prize.weight) return prize.name;
    random -= prize.weight;
  }
  return '參加獎：現金 200 元';
};

export default function App() {
  // 移除 user 狀態，因為不需要 Firebase 登入了
  const [view, setView] = useState('login');
  const [formData, setFormData] = useState({ name: '', company: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scratchContainerRef = useRef<HTMLDivElement>(null);
  const [isScratched, setIsScratched] = useState(false);

  // --- Video Logic Control ---
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
      setView('scratch');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Google Form Submission Logic ---
  const submitToGoogleForm = async (data: typeof formData) => {
    const { actionURL, entryName, entryCompany, entryPhone } = GOOGLE_FORM_CONFIG;
    if (!actionURL) return;

    const formBody = new FormData();
    formBody.append(entryName, data.name);
    formBody.append(entryCompany, data.company);
    formBody.append(entryPhone, data.phone);

    try {
      // 使用 no-cors 模式發送，瀏覽器才不會擋跨域請求 (雖然收不到回應，但 Google 會收到資料)
      await fetch(actionURL, {
        method: "POST",
        body: formBody,
        mode: "no-cors"
      });
      console.log("已傳送至 Google Form");
    } catch (error) {
      console.error("Google Form 傳送失敗 (不影響抽獎進行)", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. 分配獎項 (查表 - 非同步)
      const assignedPrize = await assignPrize(formData.phone);
      setPrize(assignedPrize);

      // 2. 傳送資料給 Google Form (背景執行，不等待結果以免卡住)
      submitToGoogleForm(formData);

      // 3. 模擬短暫處理時間，然後進入播放階段
      setTimeout(() => {
        setLoading(false);
        setView('playing_action');

        if (videoRef.current) {
          videoRef.current.muted = false;
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              if (videoRef.current) {
                videoRef.current.muted = true; // 如果瀏覽器擋聲音，就靜音播放
                videoRef.current.play();
              }
            });
          }
        }
      }, 500);

    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
      alert("請稍後再試");
    }
  };

  // Canvas Scratch Logic
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

        // Draw Scratch Layer
        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Watermarks
        ctx.font = '14px "Songti TC", "Noto Serif TC", "PMingLiU", serif';
        ctx.fillStyle = '#A0A0A0';
        const words = ['發', '財', '旺', '吉', '$'];
        for (let i = 0; i < 200; i++) {
          const w = words[Math.floor(Math.random() * words.length)];
          ctx.fillText(w, Math.random() * canvas.width, Math.random() * canvas.height);
        }

        // Call to Action Text
        ctx.save();
        ctx.font = 'bold 32px "Songti TC", "Noto Serif TC", "PMingLiU", serif';
        ctx.fillStyle = '#DC2626';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = "white";
        ctx.shadowBlur = 4;
        ctx.fillText('刮開中大獎', canvas.width / 2, canvas.height / 2);

        // Circle border
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2, 110, 40, 0, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();

        ctx.globalCompositeOperation = 'destination-out';
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
        if (isScratched || moveCount < 20) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        const sampleRate = 16;
        for (let i = 3; i < imageData.data.length; i += 4 * sampleRate) {
          if (imageData.data[i] === 0) transparent++;
        }
        const totalSampled = (imageData.data.length / 4) / sampleRate;
        if ((transparent / totalSampled) * 100 > 50) {
          setIsScratched(true);
          setTimeout(() => setView('result'), 800);
        }
      };

      const handleStart = (e: any) => { isDrawing = true; const pos = getPos(e); scratch(pos.x, pos.y); };
      const handleMove = (e: any) => { if (!isDrawing) return; e.preventDefault(); const pos = getPos(e); scratch(pos.x, pos.y); };
      const handleEnd = () => { isDrawing = false; checkTransparency(); };

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
          <div className="w-full max-w-md bg-black/40 backdrop-blur-md p-8 rounded-2xl border border-yellow-500/30 shadow-2xl shadow-yellow-900/20">
            <div className="text-center mb-8">
              {/* Logo Updated */}
              <img
                src="https://fphra4iikbpe4rrw.public.blob.vercel-storage.com/a466e6dbb78746f9f4448c643eb82d47-removebg-preview.png"
                alt="2026 祥獅獻瑞"
                className="w-full max-w-[280px] mx-auto mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] object-contain"
              />
              <p className="text-yellow-100/80">尾牙幸運大抽獎</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    required
                    name="name"
                    type="text"
                    placeholder="請輸入您的姓名"
                    className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm text-yellow-200 ml-1">公司/部門</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    required
                    name="company"
                    type="text"
                    placeholder="請輸入部門或公司名稱"
                    className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                    value={formData.company}
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

      {/* --- 3. Scratch Card Page --- */}
      {view === 'scratch' && (
        <div className="relative z-30 h-full w-full flex flex-col items-center justify-center animate-appear">
          {/* Card Container: Red Background with Gold Double Border */}
          <div className="relative w-80 h-48 md:w-96 md:h-64 bg-red-700 rounded-lg shadow-[0_0_50px_rgba(255,215,0,0.8)] border-4 border-yellow-400 ring-4 ring-red-800 ring-offset-2 ring-offset-yellow-500 overflow-hidden transform transition-all duration-500">

            <div className="absolute top-1 left-1 w-8 h-8 border-t-2 border-l-2 border-yellow-300 z-10" />
            <div className="absolute top-1 right-1 w-8 h-8 border-t-2 border-r-2 border-yellow-300 z-10" />
            <div className="absolute bottom-1 left-1 w-8 h-8 border-b-2 border-l-2 border-yellow-300 z-10" />
            <div className="absolute bottom-1 right-1 w-8 h-8 border-b-2 border-r-2 border-yellow-300 z-10" />

            {/* Prize Underneath (Sunburst Background) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-red-500 via-red-600 to-red-800 text-center p-4">
              <div className="absolute inset-0 opacity-20 bg-[repeating-conic-gradient(#fbbf24_0_15deg,transparent_15deg_30deg)] animate-[spin_20s_linear_infinite]" />
              <div className="relative z-10">
                <Trophy className="w-12 h-12 text-yellow-300 mb-2 animate-bounce mx-auto" />
                <h3 className="text-yellow-200 text-lg font-bold">恭喜獲得</h3>
                <p className="text-2xl md:text-3xl font-black text-white leading-tight mt-1 drop-shadow-md">{prize}</p>
              </div>
            </div>

            {/* Canvas Overlay */}
            <div ref={scratchContainerRef} className="absolute inset-2 cursor-pointer rounded border border-yellow-600/50 overflow-hidden bg-gray-300">
              <canvas ref={canvasRef} className="w-full h-full touch-none" />
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 bg-red-900/80 px-6 py-2 rounded-full border border-yellow-500/50 animate-pulse">
            <Coins className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-100 text-lg font-bold">
              手指用力刮！財神到你家！
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

            <div className="flex items-center justify-center gap-2 text-gray-300 text-sm bg-black/40 py-2 px-4 rounded-full mb-6 mx-auto w-fit">
              <Camera className="w-4 h-4" />
              <span>請截圖此畫面</span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed">
              請務必保留此截圖，並於活動結束後，<br />
              向 <span className="text-yellow-500 font-bold">福委會</span> 出示截圖以領取獎項。
            </p>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-left text-sm text-gray-400">
                <div>
                  <span className="block text-gray-600 text-xs">姓名</span>
                  <span className="text-gray-200">{formData.name}</span>
                </div>
                <div>
                  <span className="block text-gray-600 text-xs">電話</span>
                  <span className="text-gray-200">{formData.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes appear { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out; }
        .animate-appear { animation: appear 0.6s ease-out; }
        
        .font-serif {
          font-family: "Songti TC", "Noto Serif TC", "PMingLiU", "SimSun", serif;
        }
      `}</style>
    </div>
  );
}
