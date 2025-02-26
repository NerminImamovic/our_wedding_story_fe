import React, { useCallback, useRef, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
interface QRCodeGeneratorProps {
  slug: string;
  disabled: boolean;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ slug, disabled }) => {
  const [qrCodeData, setQrCodeData] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = useCallback(async () => {
    if (!slug) {
      console.error('Slug is missing');
      return;
    }

    const qrUrl = `http://localhost:3000/${slug}`;

    try {
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrCodeData(dataUrl);

      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, qrUrl, {
          width: 300,
          margin: 2,
        });
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [slug]);

  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `${slug}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [slug]);

  return (
    <div className="space-y-4">
      <button
        className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors ${slug === '' ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
          } else {
            generateQRCode();
          }
        }}
      >
        Generate QR Code
      </button>

      {qrCodeData && (
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <Image src={qrCodeData} alt="QR Code" className="border-2 border-pink-200 rounded-lg" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <button
            onClick={handleDownload}
            className={`w-full py-3 px-4 rounded-lg transition-colors ${disabled ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
          >
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator; 
