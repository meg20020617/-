import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import confetti from 'canvas-confetti';

interface ScratchCardProps {
    width?: number;
    height?: number;
    onComplete: () => void;
    prizeName: string;
}

export function ScratchCard({ width = 300, height = 150, onComplete, prizeName }: ScratchCardProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isScratching, setIsScratching] = useState(false);
    const [confettiFired, setConfettiFired] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true }); // optimize for read
        if (!ctx) return;

        // Use requested image texture
        const coatingImg = new Image();
        coatingImg.src = '/images/scratch_coating.jpg';

        coatingImg.onload = function () {
            if (!canvasRef.current) return;
            const currentCtx = canvasRef.current.getContext('2d');
            if (!currentCtx) return;

            currentCtx.globalCompositeOperation = 'source-over';

            // Pattern
            const pattern = currentCtx.createPattern(coatingImg, 'repeat');
            if (pattern) {
                currentCtx.fillStyle = pattern;
                currentCtx.fillRect(0, 0, width, height);
            } else {
                // Fallback
                currentCtx.fillStyle = '#FCD34D';
                currentCtx.fillRect(0, 0, width, height);
            }

            // Text Over Coating
            currentCtx.font = 'bold 24px "Noto Serif TC", "Songti TC", "SimSun", serif';
            currentCtx.fillStyle = '#8B0000'; // Dark Red per request
            currentCtx.textAlign = 'center';
            currentCtx.textBaseline = 'middle';
            currentCtx.fillText('請用力刮開', width / 2, height / 2);

            // Reset to erase mode
            currentCtx.globalCompositeOperation = 'destination-out';
        };

        // Fallback if image fails to load or for immediate render
        ctx.fillStyle = '#FCD34D';
        ctx.fillRect(0, 0, width, height);

    }, [width, height]);

    const fireConfetti = () => {
        if (confettiFired) return;
        setConfettiFired(true);

        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FCD34D', '#881337', '#FFFFFF'] // Gold, Red, White
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#FCD34D', '#881337', '#FFFFFF']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();
    };

    const checkCompletion = () => {
        const canvas = canvasRef.current;
        if (!canvas || isCompleted) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        let transparentPixels = 0;

        // Iterate every 4th pixel to speed up
        for (let i = 3; i < pixels.length; i += 16) {
            if (pixels[i] === 0) {
                transparentPixels++;
            }
        }

        const totalCheckPixels = pixels.length / 16;
        const percentage = (transparentPixels / totalCheckPixels) * 100;

        if (percentage > 45) {
            setIsCompleted(true);
            fireConfetti();
            onComplete(); // Trigger parent
        }
    };

    const scratch = (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas || isCompleted) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2); // Brush size
        ctx.fill();

        // Check completion throttling
        if (Math.random() > 0.3) {
            checkCompletion();
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isScratching) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        scratch(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!isScratching) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const touch = e.touches[0];
        scratch(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    return (
        <div className="relative rounded-xl overflow-hidden shadow-2xl elevation-card" style={{ width, height }} ref={containerRef}>
            {/* Background Prize Layer */}
            <div className="absolute inset-0 bg-white flex items-center justify-center p-4">
                <div className="text-center w-full">
                    <p className="text-sm text-gray-400 mb-1">恭喜獲得</p>
                    <p className="text-xl font-bold text-secondary font-serif break-words line-clamp-2 px-2">{prizeName}</p>
                </div>
            </div>

            {/* Canvas Mask Layer */}
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={cn(
                    "absolute inset-0 z-10 touch-none transition-opacity duration-1000",
                    isCompleted ? "opacity-0 pointer-events-none" : "opacity-100 cursor-pointer"
                )}
                onMouseDown={() => setIsScratching(true)}
                onMouseUp={() => setIsScratching(false)}
                onMouseLeave={() => setIsScratching(false)}
                onMouseMove={handleMouseMove}
                onTouchStart={() => setIsScratching(true)}
                onTouchEnd={() => setIsScratching(false)}
                onTouchMove={handleTouchMove}
            />
        </div>
    );
}
