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
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">QR Code Generator</h3>
        <p className="text-sm text-gray-500">Generate a QR code for your wedding page to share with guests</p>
      </div>
      
      <button
        className={`w-full bg-gradient-to-r from-gold-400 to-gold-500 text-white py-4 px-6 rounded-xl hover:from-gold-500 hover:to-gold-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium tracking-wide ${
          !slug ? 'from-gray-300 to-gray-400 cursor-not-allowed hover:from-gray-300 hover:to-gray-400 transform-none' : ''
        }`}
        onClick={(e) => {
          if (!slug) {
            e.preventDefault();
          } else {
            generateQRCode();
          }
        }}
      >
        {!slug ? 'Generate QR Code' : 'Generate QR Code'}
      </button>

      {qrCodeData && (
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-md font-medium text-gray-700 mb-3">Your Wedding QR Code</h4>
            <div className="flex justify-center p-6 bg-white rounded-xl border-2 border-gold-200 shadow-md">
              <div className="relative">
                <Image 
                  src={qrCodeData} 
                  alt="QR Code" 
                  width={300} 
                  height={300} 
                  className="rounded-lg"
                />
                <div className="absolute inset-0 border border-gold-300 rounded-lg m-1 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-3">Scan this QR code to visit your wedding page</p>
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
          
          <button
            onClick={handleDownload}
            className={`w-full py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium tracking-wide ${
              !slug 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gold-50 text-gold-700 hover:bg-gold-100 border-2 border-gold-200 hover:border-gold-300'
            }`}
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Download QR Code
            </div>
          </button>
        </div>
      )}
      
      {!slug && (
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500 italic">Please complete your wedding details first to generate a QR code</p>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator; 
