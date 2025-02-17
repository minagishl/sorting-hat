import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const HOUSES = [
  'グリフィンドール',
  'スリザリン',
  'レイブンクロー',
  'ハッフルパフ',
];

const HOUSE_COLORS: Record<string, string> = {
  グリフィンドール: 'text-red-500',
  スリザリン: 'text-green-500',
  レイブンクロー: 'text-blue-500',
  ハッフルパフ: 'text-yellow-400',
};

const SORTING_MESSAGES = [
  'ふむ...難しい、とても難しい...',
  '勇気があるようだ...',
  '頭脳明晰だ...',
  'そうだな...君の運命の寮は...',
];

// Simple string hash function (always returns the same hash for the same input)
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: 'px',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isSorting, setIsSorting] = useState(false);
  const [messageIndex, setMessageIndex] = useState(-1);
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setCroppedImage(null);
        setIsSorting(false);
        setMessageIndex(-1);
        setSelectedHouse(null);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = () => {
    if (!imageRef.current || !completedCrop) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      imageRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    setCroppedImage(canvas.toDataURL());
  };

  const startSorting = () => {
    if (!croppedImage) return;

    // Calculate the hash value, and determine the house index using the absolute value
    const hash = Math.abs(hashString(croppedImage));
    const houseIndex = hash % HOUSES.length;

    setIsSorting(true);
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prev) => {
        if (prev >= SORTING_MESSAGES.length - 1) {
          clearInterval(interval);
          setSelectedHouse(HOUSES[houseIndex]);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-8 flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        {!selectedImage && (
          <div className="flex items-center justify-center h-screen">
            <label className="block p-8 border-2 border-dashed border-gray-600 cursor-pointer hover:border-gray-500 transition-colors rounded-xl">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <span className="text-lg">画像を選択してください</span>
            </label>
          </div>
        )}

        {selectedImage && !croppedImage && (
          <div className="space-y-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              circularCrop
              className="max-w-full w-full"
            >
              <img
                src={selectedImage}
                alt="Upload"
                onLoad={(e) => {
                  imageRef.current = e.currentTarget;
                  if (!completedCrop) {
                    setCompletedCrop({ ...crop, unit: 'px' });
                  }
                }}
                className="max-w-full block mx-auto w-full"
              />
            </ReactCrop>
            <button
              onClick={getCroppedImg}
              className="mx-auto transition-colors w-full"
            >
              <div className="p-4 font-semibold w-fit mx-auto bg-zinc-50 rounded-lg hover:bg-zinc-100 text-black">
                画像を確定
              </div>
            </button>
          </div>
        )}

        {croppedImage && (
          <div className="relative w-80 h-80 mx-auto">
            <div className="w-full h-full rounded-full overflow-hidden border-8 border-[#464E59]">
              <img
                src={croppedImage}
                alt="Cropped"
                className="w-full h-full object-cover select-none pointer-events-none"
              />
            </div>
            <img
              src="/witch-hat.png"
              alt="Witch Hat"
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-40 h-40 object-contain z-20 select-none pointer-events-none"
            />
            {!isSorting && (
              <button
                onClick={startSorting}
                className="absolute pt-12 left-1/2 -translate-x-1/2 transition-colors z-10"
              >
                <div className="p-4 font-semibold bg-zinc-50 rounded-lg hover:bg-zinc-100 text-black">
                  組み分けを始める
                </div>
              </button>
            )}
            {isSorting && messageIndex >= 0 && (
              <div className="absolute pt-12 left-1/2 -translate-x-1/2 w-full text-center">
                <p className="text-xl font-medium">
                  {SORTING_MESSAGES[messageIndex]}
                </p>
                {selectedHouse && (
                  <div>
                    <p
                      className={`text-2xl font-bold mt-4 ${HOUSE_COLORS[selectedHouse]}`}
                    >
                      {selectedHouse}!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
