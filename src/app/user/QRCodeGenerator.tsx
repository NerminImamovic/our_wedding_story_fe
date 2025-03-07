'use client'

import React, { useCallback, useRef, useState } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { useUser } from './UserContext';

const QRCodeGenerator: React.FC = () => {
  const { slug } = useUser();
  const [qrCodeData, setQrCodeData] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQRCode = useCallback(async () => {
    if (!slug) {
      console.error('Slug is missing');
      return;
    }

    const qrUrl = `https://our-wedding-story.com/${slug}`;

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
    if (!qrCodeData) return;
    
    const link = document.createElement('a');
    link.download = `${slug}.png`;
    link.href = qrCodeData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrCodeData, slug]);

  return (
    <div className="space-y-4">
      <button
        className={`w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors ${!slug ? 'disabled:bg-gray-100 cursor-not-allowed' : ''}`}
        onClick={(e) => {
          if (!slug) {
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
            <Image src={qrCodeData} alt="QR Code" width={300} height={300} className="border-2 border-pink-200 rounded-lg" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <button
            onClick={handleDownload}
            className={`w-full py-3 px-4 rounded-lg transition-colors ${!slug ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
          >
            Download QR Code
          </button>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator; 
