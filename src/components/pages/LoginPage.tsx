import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Settings } from 'lucide-react';

import { motion } from 'framer-motion';

interface LoginPageProps {
    onAdminClick: () => void;
}

export default function LoginPage({ onAdminClick }: LoginPageProps) {
    const { login, departments } = useApp();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [dept, setDept] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for effect
        await new Promise(r => setTimeout(r, 800));

        const result = login(name, phone, dept);
        if (!result.success) {
            setError(result.message || '登入失敗');
            setLoading(false);
        } else {
            // Success is handled by App state change
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full justify-center relative"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-widest">嘉賓簽到</h2>
                <p className="text-white/60">請輸入您的資訊以參加抽獎</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-accent text-sm font-bold tracking-wider ml-1">姓名</label>
                    <Input
                        placeholder="請輸入姓名"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-accent text-sm font-bold tracking-wider ml-1">電話</label>
                    <Input
                        placeholder="請輸入電話號碼"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-accent text-sm font-bold tracking-wider ml-1">部門</label>
                    <Select
                        placeholder="請選擇部門"
                        options={departments.map(d => ({ value: d, label: d }))}
                        value={dept}
                        onChange={(e) => setDept(e.target.value)}
                        required
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" className="w-full text-xl py-6" disabled={loading}>
                        {loading ? '驗證中...' : '確認簽到'}
                    </Button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-red-400 text-center text-sm bg-red-900/20 p-2 rounded-lg border border-red-500/30"
                    >
                        {error}
                    </motion.div>
                )}
            </form>

            {/* Admin Toggle */}
            <button
                onClick={onAdminClick}
                className="absolute -bottom-4 -right-4 p-4 text-white/5 hover:text-white/20 transition-colors"
            >
                <Settings size={20} />
            </button>
        </motion.div>
    );
}
