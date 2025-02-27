import { BASE_URL } from '@/api/apiClient';
import React from 'react';

interface AuthorizeButtonProps {
  disabled: boolean;
  email: string;
}

const AuthorizeButton: React.FC<AuthorizeButtonProps> = ({ disabled, email }) => {
  return (
    <a
      href={`${BASE_URL}/auth?email=${email}`}
      className={`mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 ${disabled ? 'disabled:bg-gray-100 cursor-not-allowed' : ''} flex items-center justify-center`}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
        }
      }}
    >
      <div className="flex items-center">
        <span className="text-lg mr-2">Authorize Google Drive</span>
        <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 50 50">
          <path fill="white" d="M45.58 31H32.61L19.73 6h10.754c.726 0 1.394.393 1.747 1.027L45.58 31zM23.37 17.43L9.94 43.2 3.482 33.04c-.395-.622-.417-1.411-.055-2.053L17.48 6 23.37 17.43zM45.54 33l-6.401 10.073C38.772 43.65 38.136 44 37.451 44H11.78l5.73-11H45.54z"></path>
        </svg>
      </div>
    </a>
  );
};

export default AuthorizeButton; 
