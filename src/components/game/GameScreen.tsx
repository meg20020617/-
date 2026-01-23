import { useState } from 'react';
import { motion } from 'framer-motion';
import { ScratchCard } from './ScratchCard';
import type { User } from '../../context/AppContext';

interface GameScreenProps {
    user: User;
    onRestart: () => void;
}

export default function GameScreen({ user, onRestart }: GameScreenProps) {
    const [revealed, setRevealed] = useState(false);

    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-4 overflow-hidden relative">
            {/* "Lion Mouth" area logic mostly visual via animation origin */}

            <motion.div
                initial={{ y: -600, rotate: -5 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{
                    type: "spring",
                    damping: 12,
                    stiffness: 60,
                    delay: 0.5
                }}
                className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden relative border-8 border-yellow-500/50"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, #fff 0%, #fef3c7 100%)'
                }}
            >
                {/* Ticket Header (Perforated effect look) */}
                <div className="bg-festival p-4 text-center border-b-4 border-dashed border-yellow-500/30 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full" /> {/* Hole punch */}
                    <h2 className="text-2xl font-bold text-accent tracking-widest drop-shadow-sm">恭喜中獎</h2>
                </div>

                <div className="p-6 space-y-6 flex flex-col items-center">
                    {/* Use Info */}
                    <div className="text-center space-y-1">
                        <p className="text-gray-500 text-sm font-bold tracking-wider">{user.department}</p>
                        <h3 className="text-3xl font-bold text-primary">{user.name}</h3>
                    </div>

                    {/* Scratch Area */}
                    <div className="relative">
                        <ScratchCard
                            prizeName={user.prize}
                            onComplete={() => setRevealed(true)}
                            width={280}
                            height={160}
                        />
                    </div>

                    {/* Footer instructions */}
                    <motion.div
                        animate={{ opacity: revealed ? 1 : 0.4 }}
                        className="text-center space-y-3"
                    >
                        <p className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full inline-block">
                            {revealed ? '請截圖此畫面，向福委領獎' : '請刮開金色區域'}
                        </p>

                        {revealed && (
                            <div className="pt-2">
                                {/* Reset trigger */}
                                <button onClick={onRestart} className="mt-4 px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all w-full tracking-widest text-lg">
                                    下一位 (Next)
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Ticket Bottom Decorative */}
                <div className="h-4 bg-festival w-full relative">
                    {/* Serrated edge css could go here */}
                </div>
            </motion.div>
        </div>
    );
}
