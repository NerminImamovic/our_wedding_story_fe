/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createWeddingDetails, getMyWeddingDetails } from '../../api/apiClient';
import { uploadCoverImage } from '../actions/uploadImages';
import { useAuth, useUser as useClerkUser } from '@clerk/nextjs';
import { useUser } from './UserContext';

const generateSlug = (bride: string, groom: string, date: string): string => {
  const formattedDate = new Date(date).toISOString().split('T')[0];
  return `${bride}-${groom}-${formattedDate}`;
};

const WeddingForm: React.FC = () => {
  const [formData, setFormData] = useState({
    bride: '',
    groom: '',
    weddingDate: '',
    slug: '',
    email: '',
    coverImage: null as File | null,
    coverImageUrl: '',
    welcomeMessage: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isClientReady, setIsClientReady] = useState(false);
  const { getToken, userId } = useAuth();
  const { user, isLoaded, isSignedIn } = useClerkUser();
  const { setSlug, setEmail, email } = useUser();

  // Set client-side rendering flag
  useEffect(() => {
    setIsClientReady(true);
  }, []);

  // Set email from Clerk user when available
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.emailAddresses?.length > 0) {

      console.log('primaryEmailAddress', user.primaryEmailAddress);

      const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0].emailAddress;
      setFormData(prev => ({ ...prev, email: primaryEmail }));
      setEmail(primaryEmail);
    }
  }, [isLoaded, isSignedIn, user, setEmail]);

  const { data: details, error } = useQuery({
    queryKey: ['weddingDetails', { email: formData.email }],
    queryFn: () => getMyWeddingDetails({ email: formData.email }),
    enabled: !!formData.email && isClientReady, // Only run query when email is available and client is ready
  });

  useEffect(() => {
    if (details) {
      setFormData({
        bride: details.bride,
        groom: details.groom,
        weddingDate: details.weddingDate,
        slug: details.slug,
        email: email,
        coverImage: null,
        coverImageUrl: details.coverImageUrl,
        welcomeMessage: details.welcomeMessage,
      });

      setSlug(details.slug);
      setEmail(details.email);
    }
    if (error) {
      console.error('Error fetching wedding details:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details, error, setSlug, setEmail]);

  const mutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const token = await getToken();
      if (!token) throw new Error('Authentication token not available');

      return createWeddingDetails(data, token);
    },
    onSuccess: () => {
      console.log('Wedding details created successfully');
    },
    onError: (error) => {
      console.error('Error creating wedding details:', error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'coverImage' && files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    if (formData.bride && formData.groom && formData.weddingDate) {
      const newSlug = generateSlug(formData.bride, formData.groom, formData.weddingDate);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
  }, [formData.bride, formData.groom, formData.weddingDate]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.coverImage && !formData.coverImageUrl) return;

      setUploading(true);
      setUploadStatus('');

      try {
        let coverImageUrl = formData.coverImageUrl;

        if (formData.coverImage) {
          const formDataToUpload = new FormData();
          formDataToUpload.append('coverImage', formData.coverImage);
          
          const result = await uploadCoverImage(formDataToUpload);
          
          if (result.success) {
            setUploadStatus('Slika naslovnice uspješno učitana!');
            coverImageUrl = result.url || '';
            
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
          } else {
            setUploadStatus('Neuspješno učitavanje slike naslovnice. Pokušajte ponovo.');
            return;
          }
        }

        setFormData((prev) => ({ ...prev, coverImageUrl }));
        setTimeout(() => setUploadStatus(''), 3000);

        mutation.mutate({
          userId,
          bride: formData.bride,
          groom: formData.groom,
          weddingDate: formData.weddingDate,
          slug: formData.slug,
          coverImageUrl,
          email: formData.email,
          welcomeMessage: formData.welcomeMessage,
        });

        setSlug(formData.slug);
        setEmail(formData.email);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus('Učitavanje neuspješno. Pokušajte ponovo.');
      } finally {
        setUploading(false);
      }
    },
    [userId, formData.coverImage, formData.bride, formData.groom, formData.weddingDate, formData.slug, formData.coverImageUrl, formData.email, formData.welcomeMessage, mutation, setSlug, setEmail]
  );

  if (!isClientReady || !isLoaded || !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-t-4 border-t-transparent border-gold-300 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium animate-pulse italic">Učitavanje...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block mb-3 text-lg font-medium text-gray-700 tracking-wide">
          Ime mlade
        </label>
        <input
          type="text"
          name="bride"
          value={formData.bride || ''}
          onChange={handleInputChange}
          className="block w-full p-4 text-gray-900 border border-gold-200 rounded-xl bg-white text-lg focus:ring-2 focus:ring-gold-300 focus:border-gold-400 transition-all duration-200 shadow-sm hover:shadow-md"
          placeholder="Unesite ime mlade"
          required
        />
      </div>

      <div>
        <label className="block mb-3 text-lg font-medium text-gray-700 tracking-wide">
          Ime mladoženje
        </label>
        <input
          type="text"
          name="groom"
          value={formData.groom || ''}
          onChange={handleInputChange}
          className="block w-full p-4 text-gray-900 border border-gold-200 rounded-xl bg-white text-lg focus:ring-2 focus:ring-gold-300 focus:border-gold-400 transition-all duration-200 shadow-sm hover:shadow-md"
          placeholder="Unesite ime mladoženje"
          required
        />
      </div>

      <div>
        <label className="block mb-3 text-lg font-medium text-gray-700 tracking-wide">
          Datum vjenčanja
        </label>
        <input
          type="date"
          name="weddingDate"
          value={formData.weddingDate || ''}
          onChange={handleInputChange}
          className="block w-full p-4 text-gray-900 border border-gold-200 rounded-xl bg-white text-lg focus:ring-2 focus:ring-gold-300 focus:border-gold-400 transition-all duration-200 shadow-sm hover:shadow-md"
          required
        />
      </div>

      <div>
        <label className="block mb-3 text-lg font-medium text-gray-700 tracking-wide">
          Slika naslovnice
        </label>
        {isClientReady && (formData.coverImageUrl || formData.coverImage) && (
          <div className="mb-4">
            <div className="relative w-full h-120 overflow-hidden rounded-xl border-2 border-gold-200 shadow-md">
              <img 
                src={formData.coverImage ? URL.createObjectURL(formData.coverImage) : (formData.coverImageUrl || '/placeholder-image.jpg')} 
                alt="Pregled naslovnice" 
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 border border-gold-300 rounded-xl m-1 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        )}
        <input
          type="file"
          name="coverImage"
          accept="image/*"
          onChange={handleInputChange}
          className="block w-full p-4 text-gray-900 border border-gold-200 rounded-xl bg-white text-lg focus:ring-2 focus:ring-gold-300 focus:border-gold-400 transition-all duration-200 shadow-sm hover:shadow-md file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
        />
      </div>

      <div>
        <label className="block mb-3 text-lg font-medium text-gray-700 tracking-wide">
          Poruka dobrodoslice
        </label>
        <input
          type="text"
          name="welcomeMessage"
          value={formData.welcomeMessage || ''}
          onChange={handleInputChange}
          className="block w-full p-4 text-gray-900 border border-gold-200 rounded-xl bg-white text-lg focus:ring-2 focus:ring-gold-300 focus:border-gold-400 transition-all duration-200 shadow-sm hover:shadow-md"
          placeholder="Unesite poruku dobrodoslice"
          required
        />
      </div>

      <div>
        <label className="block mb-3 text-lg font-medium text-gray-700 tracking-wide">
          Email adresa
        </label>
        <input
          type="email"
          name="email"
          value={formData.email || ''}
          onChange={handleInputChange}
          className="block w-full p-4 text-gray-600 border border-gold-200 rounded-xl bg-gray-50 text-lg cursor-not-allowed"
          required
          readOnly
          disabled
        />
      </div>

      <div>
        <label className="block mb-3 text-lg font-medium text-gray-700 tracking-wide">
          URL Slug
        </label>
        <input
          type="text"
          name="slug"
          value={formData.slug || ''}
          disabled={true}
          onChange={handleInputChange}
          className="block w-full p-4 text-gray-600 border border-gold-200 rounded-xl bg-gray-50 text-lg cursor-not-allowed"
          required
        />
        <p className="mt-2 text-sm text-gray-500 italic">Ovo će biti automatski generisano iz vaših imena i datuma vjenčanja</p>
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="mt-6 w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white py-4 px-6 rounded-xl hover:from-gray-500 hover:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium tracking-wide"
      >
        {uploading ? (
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
            <span>Spremanje...</span>
          </div>
        ) : (
          'Spremi podatke o vjenčanju'
        )}
      </button>
      
      {uploadStatus && (
        <div className={`mt-4 p-4 rounded-xl text-center text-sm font-medium ${
          uploadStatus.includes('uspješno') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {uploadStatus}
        </div>
      )}
    </form>
  );
};

export default WeddingForm; 
