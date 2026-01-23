import { motion } from 'framer-motion';
import type { User } from '../../context/AppContext';

interface ResultScreenProps {
    user: User;
    onReset?: () => void;
}

export default function ResultScreen({ user }: ResultScreenProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center h-full justify-center space-y-6"
        >
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2"
            >
                <h2 className="text-4xl font-bold text-accent drop-shadow-lg tracking-widest">恭喜中獎</h2>
                <div className="w-16 h-1 bg-accent mx-auto rounded-full" />
            </motion.div>

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
                className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 w-full"
            >
                <p className="text-white/60 mb-2">{user.department} - {user.name}</p>
                <h1 className="text-3xl font-bold text-accent leading-relaxed font-serif">
                    {user.prize}
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-sm text-white/40 bg-black/20 px-4 py-2 rounded-full"
            >
                請截圖此畫面，向福委領獎
            </motion.div>


        </motion.div>
    );
}
