import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UserContextType {
  slug: string;
  email: string;
  setSlug: (newSlug: string) => void;
  setEmail: (newEmail: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');

  return (
    <UserContext.Provider value={{ slug, email, setSlug, setEmail }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
