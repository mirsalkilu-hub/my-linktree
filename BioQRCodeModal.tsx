"use client";

import { useState, useRef, ChangeEvent } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import { QrCode, Download, Copy, Image as ImageIcon, X } from "lucide-react";

interface BioQRCodeModalProps {
  url: string;
  pageTitle: string;
}

export default function BioQRCodeModal({ url, pageTitle }: BioQRCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [centerLogo, setCenterLogo] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  // Handle custom logo uploads for the center of the QR code
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error("Logo file must be 1 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCenterLogo(reader.result as string);
      toast.success("Center logo added to the QR code.");
    };
    reader.readAsDataURL(file);
  };

  // Download as PNG
  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas");
    if (!canvas) return;

    const image = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = image;
    anchor.download = `qrcode-${pageTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    anchor.click();
    toast.success("QR code downloaded as PNG.");
  };

  // Copy SVG to the clipboard
  const handleCopySVG = async () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    try {
      await navigator.clipboard.writeText(svgString);
      toast.success("SVG code copied to the clipboard.");
    } catch (err) {
      toast.error("Could not copy the SVG.");
    }
  };

  return (
    <>
      {/* Trigger button in the public URL area */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all text-center"
      >
        <QrCode className="w-3.5 h-3.5 text-indigo-400" />
        <span>QR Code</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-5 relative shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base text-white">QR Code</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR code preview */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl">
              {/* Visible SVG for preview and copying */}
              <div ref={svgRef}>
                <QRCodeSVG
                  value={url}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  imageSettings={
                    centerLogo
                      ? {
                          src: centerLogo,
                          x: undefined,
                          y: undefined,
                          height: 40,
                          width: 40,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              {/* Hidden canvas used for PNG downloads */}
              <div ref={canvasRef} className="hidden">
                <QRCodeCanvas
                  value={url}
                  size={400} // High Resolution PNG
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="H"
                  imageSettings={
                    centerLogo
                      ? {
                          src: centerLogo,
                          x: undefined,
                          y: undefined,
                          height: 80,
                          width: 80,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Center logo customization */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Center Logo (Optional)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 hover:border-slate-700 cursor-pointer transition-all">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  <span>{centerLogo ? "Change Logo" : "Upload Logo (PNG/JPG)"}</span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {centerLogo && (
                  <button
                    onClick={() => setCenterLogo(null)}
                    className="px-3 py-2 text-xs bg-red-950/40 text-red-400 border border-red-900/50 rounded-xl hover:bg-red-900/50 transition-all"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleDownloadPNG}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download PNG</span>
              </button>
              <button
                onClick={handleCopySVG}
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold py-2.5 px-3 rounded-xl text-xs transition-all"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy SVG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}