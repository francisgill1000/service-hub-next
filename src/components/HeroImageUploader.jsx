"use client";

import { useState } from "react";
import { ImageIcon, Edit2 } from "lucide-react";
import compressImage from '@/utils/image';

export default function HeroImageUploader({
  label = "Cover Photo",
  onChange,
  accept = "image/*",
}) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 2000, 1200, 0.8);
      setPreview(dataUrl);
      onChange && onChange(dataUrl);
    } catch (err) {
      console.error('Image compression failed', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onChange && onChange(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <label className="group relative flex flex-col items-center justify-center w-full h-48 bg-[#151921] border-2 border-dashed border-white/10 rounded-3xl cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {preview ? (
        <>
          <img
            src={preview}
            alt="Hero Preview"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Edit Badge */}
          <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md p-2 rounded-full border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <Edit2 size={16} />
          </div>
        </>
      ) : (
        <div className="relative z-20 flex flex-col items-center gap-2">
          <div className="bg-white/5 p-4 rounded-full text-white/20 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-all">
            <ImageIcon size={32} />
          </div>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
            {label}
          </span>
        </div>
      )}

      <input
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
    </label>
  );
}