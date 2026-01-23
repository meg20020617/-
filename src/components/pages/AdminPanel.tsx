import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Trash2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminPanelProps {
    onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const { config, updateConfig, departments, addDepartment, removeDepartment, importUsers } = useApp();
    const [imageUrl, setImageUrl] = useState(config.mainVisualUrl);
    const [videoUrl, setVideoUrl] = useState(config.eventVideoUrl);
    const [csvContent, setCsvContent] = useState('');
    const [newDept, setNewDept] = useState('');
    const [activeTab, setActiveTab] = useState<'general' | 'data'>('general');

    const handleSaveImage = () => {
        updateConfig({ mainVisualUrl: imageUrl });
        alert('圖片設定已更新');
    };

    const handleSaveVideo = () => {
        updateConfig({ eventVideoUrl: videoUrl });
        alert('影片設定已更新');
    };

    const handleImport = () => {
        importUsers(csvContent);
        setCsvContent('');
        alert('名單已匯入');
    };

    const handleAddDept = () => {
        if (newDept) {
            addDepartment(newDept);
            setNewDept('');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 z-50 bg-neutral-900 text-white flex flex-col"
        >
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-800">
                <h2 className="text-xl font-bold">後台管理</h2>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={24} />
                </button>
            </div>

            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex-1 p-4 text-center font-bold ${activeTab === 'general' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}
                >
                    一般設定
                </button>
                <button
                    onClick={() => setActiveTab('data')}
                    className={`flex-1 p-4 text-center font-bold ${activeTab === 'data' ? 'text-accent border-b-2 border-accent' : 'text-gray-400'}`}
                >
                    名單數據
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {activeTab === 'general' && (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-accent">主視覺圖片 URL</h3>
                            <div className="flex gap-2">
                                <Input
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                <Button onClick={handleSaveImage}>更新</Button>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                預覽：
                                {imageUrl && <img src={imageUrl} className="h-20 object-contain mt-1 border border-white/10" />}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-accent">活動影片 URL</h3>
                            <div className="flex gap-2">
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                <Button onClick={handleSaveVideo}>更新</Button>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                                預覽：
                                {videoUrl && <video src={videoUrl} className="h-20 object-cover mt-1 border border-white/10" autoPlay loop muted />}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-accent">部門管理</h3>
                            <div className="flex gap-2">
                                <Input
                                    value={newDept}
                                    onChange={(e) => setNewDept(e.target.value)}
                                    placeholder="新部門名稱"
                                />
                                <Button onClick={handleAddDept} size="icon"><Plus /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {departments.map(dept => (
                                    <div key={dept} className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                                        <span>{dept}</span>
                                        <button onClick={() => removeDepartment(dept)} className="text-red-400 hover:text-red-300">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="space-y-8">
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-accent">匯入名單 (CSV)</h3>
                            <p className="text-sm text-gray-400">格式：姓名,電話,部門,獎項 (每行一筆)</p>
                            <textarea
                                className="w-full h-40 bg-black/30 border border-white/20 rounded-lg p-3 text-white font-mono text-sm focus:border-accent outline-none"
                                placeholder={`王大明,0912345678,業務部,頭獎\n張小美,0987654321,行政部,二獎`}
                                value={csvContent}
                                onChange={(e) => setCsvContent(e.target.value)}
                            />
                            <Button onClick={handleImport} className="w-full">匯入資料</Button>
                        </section>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
