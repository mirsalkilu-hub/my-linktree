"use client";

import { useState, useRef, useEffect } from "react";
import LinkIcon from "./LinkIcon";
import { ChevronDown } from "lucide-react";

export const ICON_OPTIONS = [
  { id: "link", label: "Link Default" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "drive", label: "Google Drive / File" },
  { id: "dropbox", label: "Dropbox" },
  { id: "globe", label: "Website / Blog" },
  { id: "email", label: "Email" },
  { id: "tiktok", label: "TikTok" },
];

interface IconSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconSelect({ value, onChange }: IconSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = ICON_OPTIONS.find((opt) => opt.id === value) || ICON_OPTIONS[0];

  // Tutup dropdown jika klik di luar komponen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Tombol Dropdown Utama */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
      >
        <div className="flex items-center space-x-3">
          <LinkIcon type={selectedOption.id} className="w-5 h-5 shrink-0" />
          <span className="font-medium">{selectedOption.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Menu Opsi Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto py-1">
          {ICON_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 flex items-center space-x-3 text-sm text-left transition-colors ${
                option.id === value
                  ? "bg-indigo-600/20 text-indigo-300 font-bold"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <LinkIcon type={option.id} className="w-5 h-5 shrink-0" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}