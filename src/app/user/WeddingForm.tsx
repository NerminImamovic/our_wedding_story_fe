import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createWeddingDetails, getMyWeddingDetails } from '../../api/apiClient';
import { uploadCoverImage } from '../actions/uploadImages';

interface WeddingFormProps {
  onFormSubmit: (slug: string) => void;
}

const generateSlug = (bride: string, groom: string, date: string): string => {
  const formattedDate = new Date(date).toISOString().split('T')[0];
  return `${bride}-${groom}-${formattedDate}`;
};

const WeddingForm: React.FC<WeddingFormProps> = ({ onFormSubmit }) => {
  const [formData, setFormData] = useState({
    bride: '',
    groom: '',
    weddingDate: '',
    slug: '',
    email: 'nimamovic9@gmail.com',
    coverImage: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const { data: details, error } = useQuery({
    queryKey: ['weddingDetails', { email: 'nimamovic9@gmail.com' }],
    queryFn: () => getMyWeddingDetails({ email: 'nimamovic9@gmail.com' }),
  });

  useEffect(() => {
    if (details) {
      setFormData({
        bride: details.bride,
        groom: details.groom,
        weddingDate: details.weddingDate,
        slug: details.slug,
        email: 'nimamovic9@gmail.com',
        coverImage: null,
      });
    }
    if (error) {
      console.error('Error fetching wedding details:', error);
    }
  }, [details, error]);

  const mutation = useMutation({
    mutationFn: createWeddingDetails,
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
      if (!formData.coverImage) return;

      setUploading(true);
      setUploadStatus('');

      const formDataToUpload = new FormData();
      formDataToUpload.append('coverImage', formData.coverImage);

      try {
        const result = await uploadCoverImage(formDataToUpload);

        if (result.success) {
          setUploadStatus('Cover image uploaded successfully!');
          setFormData((prev) => ({ ...prev }));
          setTimeout(() => setUploadStatus(''), 3000);

          mutation.mutate({
            bride: formData.bride,
            groom: formData.groom,
            weddingDate: formData.weddingDate,
            slug: formData.slug,
            coverImageUrl: result.url ? result.url : '',
            email: formData.email,
          });

          onFormSubmit(formData.slug);
        } else {
          setUploadStatus('Failed to upload cover image. Please try again.');
        }

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus('Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [formData.coverImage, formData.bride, formData.groom, formData.weddingDate, formData.slug, formData.email, mutation, onFormSubmit]
  );

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
      <input
        type="file"
        name="coverImage"
        accept="image/*"
        onChange={handleInputChange}
        className="block w-full p-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
        required
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
