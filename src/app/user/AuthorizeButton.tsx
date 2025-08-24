'use client'

import { BASE_URL } from '@/api/apiClient';
import React from 'react';
import { useUser } from './UserContext';

const AuthorizeButton: React.FC = () => {
  const { slug, email } = useUser();

  const disabled = !slug;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-2">Google Drive Integracija</h3>
        <p className="text-sm text-gray-500">Povežite svoj Google Drive za automatsku sinhronizaciju fotografija vjenčanja</p>
      </div>
      
      <a
        href={`${BASE_URL}/auth?email=${email}`}
        className={`w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white py-4 px-6 rounded-xl hover:from-gray-500 hover:to-gray-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium tracking-wide flex items-center justify-center ${
          disabled ? 'cursor-not-allowed transform-none' : ''
        }`}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex items-center">
          <span className="text-lg mr-3">Autorizuj Google Drive</span>
          <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 50 50" className="text-white">
            <path fill="currentColor" d="M45.58 31H32.61L19.73 6h10.754c.726 0 1.394.393 1.747 1.027L45.58 31zM23.37 17.43L9.94 43.2 3.482 33.04c-.395-.622-.417-1.411-.055-2.053L17.48 6 23.37 17.43zM45.54 33l-6.401 10.073C38.772 43.65 38.136 44 37.451 44H11.78l5.73-11H45.54z"></path>
          </svg>
        </div>
      </a>
      
      {disabled && (
        <div className="text-center">
          <p className="text-sm text-gray-500 italic">Molimo vas da prvo završite podatke o vjenčanju da biste omogućili Google Drive integraciju</p>
        </div>
      )}
      
      {!disabled && (
        <div className="text-center">
          <p className="text-xs text-gray-400">Ovo će vas preusmjeriti na Google-ovu stranicu za autorizaciju</p>
        </div>
      )}
    </div>
  );
};

export default AuthorizeButton; 
