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
            setUploadStatus('Cover image uploaded successfully!');
            coverImageUrl = result.url || '';
            
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) {
              fileInput.value = '';
            }
          } else {
            setUploadStatus('Failed to upload cover image. Please try again.');
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
        });

        setSlug(formData.slug);
        setEmail(formData.email);
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [userId, formData.coverImage, formData.bride, formData.groom, formData.weddingDate, formData.slug, formData.coverImageUrl, formData.email, mutation, setSlug, setEmail]
  );

  if (!isClientReady || !isLoaded || !isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-t-4 border-b-4 border-pink-500 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
    <div>
      <label className="block mb-2 text-lg font-bold text-gray-900 dark:text-white">
        Ime mlade 
      </label>
      <input
        type="text"
        name="bride"
        value={formData.bride || ''}
        onChange={handleInputChange}
        className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
        required
      />
    </div>

    <div>
      <label className="block mb-2 text-lg font-bold text-gray-900 dark:text-white">
        Ime mladeženje
      </label>
      <input
        type="text"
        name="groom"
        value={formData.groom || ''}
        onChange={handleInputChange}
        className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
        required
      />
    </div>

    <div>
      <label className="block mb-2 text-lg font-medium text-gray-900 dark:text-white">
        Datum vjenčanja
      </label>
      <input
        type="date"
        name="weddingDate"
        value={formData.weddingDate || ''}
        onChange={handleInputChange}
        className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500 modern-datepicker"
        required
      />
    </div>

    <div>
      <label className="block mb-2 text-lg font-bold text-gray-900 dark:text-white">
        Slika naslovnice
      </label>
      {isClientReady && (formData.coverImageUrl || formData.coverImage) && (
        <div className="mb-4">
          <div className="relative w-full h-200 overflow-hidden rounded-lg">
            <img 
              src={formData.coverImage ? URL.createObjectURL(formData.coverImage) : (formData.coverImageUrl || '/placeholder-image.jpg')} 
              alt="Cover preview" 
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      )}
      <input
        type="file"
        name="coverImage"
        accept="image/*"
        onChange={handleInputChange}
        className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
      />
    </div>

    <div>
      <label className="block mb-2 text-lg font-bold text-gray-900 dark:text-white">
        Email
      </label>
      <input
        type="email"
        name="email"
        value={formData.email || ''}
        onChange={handleInputChange}
        className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
        required
        readOnly
        disabled
      />
    </div>

    <div>
      <label className="block mb-2 text-lg font-bold text-gray-900 dark:text-white">
        URL Slug
      </label>
      <input
        type="text"
        name="slug"
        value={formData.slug || ''}
        disabled={true}
        onChange={handleInputChange}
        className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
        required
      />
    </div>

    <button
      type="submit"
      disabled={uploading}
      className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-300"
    >
      {uploading ? 'Uploading...' : 'Save Details'}
    </button>
    <p className="mt-2 text-center text-sm text-gray-500">{uploadStatus}</p>
  </form>
  );
};

export default WeddingForm; 
