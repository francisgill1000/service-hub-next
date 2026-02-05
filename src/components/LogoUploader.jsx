import { useState } from "react";
import { Camera } from "lucide-react";

export default function LogoUploader({
  label = "Brand Logo",
  onChange, // Will return base64 string
  accept = "image/*",
}) {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result); // base64 string
      onChange && onChange(reader.result); // send to parent
    };
    reader.readAsDataURL(file);
  };

  return (

    <label className="group relative flex flex-col items-center justify-center w-32 min-h-30 bg-[#151921] border-2 border-dashed border-blue-500/40 rounded-2xl cursor-pointer hover:border-blue-500 transition-all overflow-hidden"> <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="bg-blue-500/10 p-3 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="object-contain w-full h-full rounded-xl"
          />
        ) : (
          <Camera size={24} />
        )}
      </div>
      <input
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
    </label>
  );

}
