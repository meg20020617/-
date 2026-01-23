import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type TopVisual = { type: 'image'; src: string } | { type: 'video'; src: string };

interface MainLayoutProps {
    children: ReactNode;
    topVisual?: TopVisual;
    className?: string;
}

export function MainLayout({ children, topVisual, className }: MainLayoutProps) {
    return (
        <div className={cn("flex flex-col h-[100dvh] w-full overflow-hidden bg-festival font-serif text-white", className)}>
            {/* Top Section (45vh) */}
            <div className="h-[45vh] w-full bg-black relative flex items-center justify-center overflow-hidden shrink-0">
                {topVisual?.type === 'video' ? (
                    <video
                        src={topVisual.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : topVisual?.type === 'image' ? (
                    <img
                        src={topVisual.src}
                        alt="Main Visual"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-gray-500 text-sm">Visual Loading...</div>
                )}
            </div>

            {/* Bottom Section (55vh) */}
            <div className="h-[55vh] w-full relative z-10 bg-transparent flex flex-col p-6 overflow-y-auto pb-20">
                <div className="flex-1 w-full max-w-md mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
