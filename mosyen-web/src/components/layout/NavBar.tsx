"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Hexagon, DiamondIcon } from "lucide-react";
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
        {/* --- DESKTOP NAVBAR (CENTERED PILL) --- */}
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
            <nav className="hidden md:flex items-center gap-2 px-2 py-2 rounded-full glass-panel">
            
            {/* Logo Placeholder */}
            {/* <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mr-4 ml-1"> */}
                {/* <DiamondIcon className="w-5 h-5 text-purple-400" /> */}
            {/* </div> */}

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
                        className="absolute inset-0 bg-white/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                    )}
                    <span className="relative z-10">{link.name}</span>
                </Link>
                );
            })}
            
            {/* Right Spacer for Balance or CTA */}
            <div className="w-4 ml-2" /> 
            </nav>

            {/* --- MOBILE NAVBAR --- */}
            <div className="md:hidden flex justify-between items-center w-full max-w-sm glass-panel rounded-full px-4 py-3">
            <div className="flex items-center gap-2">
                {/* <Hexagon className="w-6 h-6 text-blue-400" /> */}
                <span className=" text-white text-x2 font-reguler">MOSYEN</span>
            </div>
            <button onClick={() => setIsOpen(true)}>
                <Menu className="w-6 h-6 text-white" />
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
                className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center space-y-8"
            >
                <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-6 right-6 p-2 bg-white/10 rounded-full"
                >
                <X className="w-6 h-6" />
                </button>
                
                {navLinks.map((link) => (
                <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-2xl font-light tracking-widest text-white hover:text-blue-400 transition"
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