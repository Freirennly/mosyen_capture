"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Animation", href: "/animation" },
    { name: "About", href: "/about" },
];

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
        <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none">
            <nav className="hidden md:flex items-center gap-2 px-2 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-xl pointer-events-auto transition-all hover:bg-white/10">
            {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                    "relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
                    isActive ? "text-white" : "text-gray-400 hover:text-white"
                    )}
                >
                    {isActive && (
                    <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white/10 rounded-full border border-white/20"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                    )}
                    <span className="relative z-10">{link.name}</span>
                </Link>
                );
            })}
            </nav>

            {/* --- MOBILE NAVBAR --- */}
            <div className="md:hidden flex justify-end items-center w-full max-w-sm pointer-events-auto">
                <button onClick={() => setIsOpen(true)} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-full p-3 shadow-lg">
                    <Menu className="w-5 h-5 text-white" />
                </button>
            </div>
        </div>

        {/* MOBILE MENU OVERLAY */}
        <AnimatePresence>
            {isOpen && (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-8"
            >
                <button 
                    onClick={() => setIsOpen(false)} 
                    className="absolute top-6 right-6 p-3 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
                
                {navLinks.map((link) => (
                <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-3xl font-light tracking-widest text-white hover:text-blue-400 transition"
                >
                    {link.name}
                </Link>
                ))}
            </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}