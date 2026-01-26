import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
    const [password, setPassword] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !password) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);

        try {
            const res = await fetch('/api/upload_prizes', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setStatus('success');
                setMessage(`成功更新 ${data.count} 筆資料！`);
            } else {
                const txt = await res.text();
                setStatus('error');
                setMessage(txt || '上傳失敗');
            }
        } catch (err) {
            setStatus('error');
            setMessage('連線錯誤');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
            <div className="max-w-md mx-auto bg-gray-800 rounded-xl p-6 shadow-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-yellow-500">後台管理：更新獎項</h2>
                    <button onClick={onBack} className="text-gray-400 hover:text-white text-sm">返回首頁</button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">管理員密碼</label>
                        <input
                            type="password"
                            className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-yellow-500 outline-none"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="請輸入密碼"
                        />
                    </div>

                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={async () => {
                                setStatus('uploading');
                                try {
                                    const res = await fetch('/api/sync_docx', { method: 'POST' });
                                    const data = await res.json();
                                    if (res.ok) {
                                        setStatus('success');
                                        setMessage(`成功從雲端同步 ${data.updated} 筆資料！`);
                                    } else {
                                        setStatus('error');
                                        setMessage(data.error || '同步失敗');
                                    }
                                } catch (e) {
                                    setStatus('error');
                                    setMessage('連線錯誤');
                                }
                            }}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                            <Upload className="w-5 h-5" />
                            從雲端 (Blob) 同步名單
                        </button>
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-600"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">或手動上傳</span>
                        <div className="flex-grow border-t border-gray-600"></div>
                    </div>

                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-500 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept=".csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                        />
                        <Upload className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-300 font-medium">
                            {file ? file.name : '點擊或拖曳 CSV 檔案至此'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">格式: Unit, Brand, Chinese, English, Prize</p>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'uploading' || !file || !password}
                        className={`w-full py-3 rounded-lg font-bold shadow-lg transition-transform active:scale-95 ${status === 'uploading' ? 'bg-gray-600 cursor-wait' : 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:brightness-110 text-black'
                            }`}
                    >
                        {status === 'uploading' ? '更新中...' : '開始更新資料庫'}
                    </button>
                </form>

                {status === 'success' && (
                    <div className="mt-6 p-4 bg-green-900/50 border border-green-600 rounded-lg flex items-center gap-3 text-green-200 animate-slide-up">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mt-6 p-4 bg-red-900/50 border border-red-600 rounded-lg flex items-center gap-3 text-red-200 animate-slide-up">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
