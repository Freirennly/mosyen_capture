"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Save, Trash2, X } from "lucide-react";

interface GlassModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GlassModal({ isOpen, title, description, onConfirm, onCancel }: GlassModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background Gelap Blur */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
            onClick={onCancel}
          />
          
          {/* Kotak Modal Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[90%] max-w-sm"
          >
            <div className="glass-panel p-6 rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
                {/* Efek Kilau */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
                    <button onClick={onCancel} className="hover:bg-white/10 rounded-full p-1"><X className="w-5 h-5 text-gray-400" /></button>
                </div>
                
                <p className="text-gray-300 text-sm mb-8 leading-relaxed">
                   {description}
                </p>

                <div className="flex gap-3">
                    <Button onClick={onCancel} className="flex-1 bg-white/5 hover:bg-red-900/30 hover:text-red-400 text-gray-400 border border-white/5 h-12">
                        <Trash2 className="w-4 h-4 mr-2" /> Discard
                    </Button>
                    <Button onClick={onConfirm} className="flex-1 bg-white hover:bg-gray-200 text-black font-bold h-12 shadow-lg shadow-white/10">
                        <Save className="w-4 h-4 mr-2" /> Save JSON
                    </Button>
                </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}