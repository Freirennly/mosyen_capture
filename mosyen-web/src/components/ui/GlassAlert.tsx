"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export type AlertType = "info" | "success" | "warning" | "error";

interface GlassAlertProps {
    message: string;
    type?: AlertType;
    isVisible: boolean;
    onClose: () => void;
}

export function GlassAlert({ message, type = "info", isVisible, onClose }: GlassAlertProps) {
  // Auto close alert biasa setelah 3 detik
    useEffect(() => {
        if (isVisible) {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    const colors = {
        info: "border-blue-500/30 text-blue-200 bg-blue-500/20",
        success: "border-green-500/30 text-green-200 bg-green-500/20",
        warning: "border-yellow-500/30 text-yellow-200 bg-yellow-500/20",
        error: "border-red-500/30 text-red-200 bg-red-500/20",
    };

    const icons = {
        info: <Info className="w-5 h-5 text-blue-400" />,
        success: <CheckCircle className="w-5 h-5 text-green-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        error: <AlertTriangle className="w-5 h-5 text-red-400" />,
    };

    return (
        <AnimatePresence>
        {isVisible && (
            <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            // RESPONSIF: Di mobile lebar penuh (w-[90%]), di desktop auto (md:w-auto)
            className="fixed top-8 md:top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-auto max-w-md"
            >
            <div className={`flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4 rounded-2xl backdrop-blur-xl border shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ${colors[type]}`}>
                <div className="flex items-center gap-3 truncate">
                    {icons[type]}
                    <span className="font-mono text-xs md:text-sm font-medium tracking-wide truncate">{message}</span>
                </div>
                <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition shrink-0">
                <X className="w-4 h-4 opacity-70" />
                </button>
            </div>
            </motion.div>
        )}
        </AnimatePresence>
    );
}