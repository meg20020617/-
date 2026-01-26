import React, { useState, useEffect, useRef } from 'react';
import { User, Building2, Sparkles, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

const IDLE_LOOP_END = 5.0;

// Initial fallback, will be overwritten by API
const FALLBACK_COMPANIES = [
  "LEO", "Starcom", "Zenith", "Prodigious", "Digitas",
  "Performics", "MSL", "PMX", "Saatchi & Saatchi",
  "ReSources", "Publicis", "Human Resource", "Finance",
  "Administration", "Management", "Growth Intelligence",
  "Collective", "Commercial"
].sort();

const FALLBACK_PRIZE_POOL = [
  { name: '參加獎：刮刮樂一張 (現金 200 元)', weight: 100 },
];

const assignPrize = async (name: string, company: string) => {
  try {
    const res = await fetch(`/api/winner?name=${encodeURIComponent(name)}&company=${encodeURIComponent(company)}`);
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
  const [view, setView] = useState('login'); // 'login', 'playing_action', 'result'
  const [companies, setCompanies] = useState<string[]>(FALLBACK_COMPANIES);
  const [formData, setFormData] = useState({
    name: '',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const [prize, setPrize] = useState('');

  // Fetch companies on mount
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

  const videoRef = useRef<HTMLVideoElement>(null);

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
      // Directly show result instead of scratch
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
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
      const assignedPrize = await assignPrize(formData.name.trim(), formData.company);
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

  // Removed useEffect for scratch card logic

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-serif text-white">
      {/* Background Video Layer */}
      <video
        ref={videoRef}
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        src="https://h3iruobmqaxiuwr1.public.blob.vercel-storage.com/%E7%9B%B4%E5%BC%8F%E6%8A%BD%E7%8D%8E%E5%B0%81%E9%9D%A2%E5%8B%95%E6%85%8B.mp4"
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
                <label className="text-sm text-yellow-200 ml-1">中文姓名</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-yellow-500" />
                  <input
                    required
                    name="name"
                    type="text"
                    placeholder="例如: 王小明"
                    className="w-full bg-black/50 border border-yellow-600/50 rounded-lg py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

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
                    {companies.map(c => (
                      <option key={c} value={c} className="text-black">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Removed Phone input */}

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

      {/* Removed Scratch Card Page */}

      {/* --- 3. Result Page (Pop-up Overlay) --- */}
      {view === 'result' && (
        <div className="relative z-40 h-full w-full flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          {/* Confetti should have fired on mount */}

          {/* Semi-transparent Glass Overlay */}
          <div className="bg-black/80 backdrop-blur-xl p-8 rounded-3xl border border-yellow-500/50 shadow-[0_0_80px_rgba(234,179,8,0.5)] max-w-lg w-full relative overflow-hidden">

            {/* Spinning Light Effect Behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(234,179,8,0.1)_180deg,transparent_360deg)] animate-[spin_10s_linear_infinite] pointer-events-none" />

            <div className="relative z-10">
              <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-pulse" />

              <h2 className="text-3xl font-bold text-yellow-500 mb-4 tracking-wider">中獎通知</h2>

              <div className="bg-gradient-to-br from-red-900/80 to-red-950/80 p-8 rounded-2xl border border-red-500/30 my-6 shadow-inner transform hover:scale-[1.02] transition-transform">
                <p className="text-red-200 text-sm mb-2 tracking-widest">CHINESE NEW YEAR 2026</p>
                <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 break-words leading-tight drop-shadow-sm">
                  {prize}
                </p>
              </div>

              <div className="space-y-2 mb-8">
                <p className="text-white text-lg font-bold">{formData.name}</p>
                <p className="text-yellow-500/80 text-sm">{formData.company}</p>
              </div>

              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                請務必保留此截圖，並於活動結束後，<br />
                向 <span className="text-yellow-500 font-bold">福委會</span> 出示截圖以領取獎項。
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-8 py-2 rounded-full border border-yellow-500/30 text-yellow-500/60 hover:text-yellow-400 hover:border-yellow-400 hover:bg-yellow-500/10 transition-all text-sm"
              >
                返回首頁
              </button>
            </div>
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
