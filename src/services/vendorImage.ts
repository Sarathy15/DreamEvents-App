/**
 * Convenience wrappers to upload images to ImageKit with a logical folder structure.
 * These use the existing client-side upload helper. In a production app you should
 * move private keys to a backend endpoint that returns authentication parameters.
 */

/**
 * Convenience wrappers to upload images to ImageKit with a logical folder structure.
 * NOTE: this file does a client-side upload using a private key embedded in the
 * repo (same pattern used elsewhere in the project). For production you should
 * move uploads to a server-side endpoint that returns signed params.
 */

const PRIVATE_KEY = 'private_X3la6pcXa6oxhA9mDIQl6FFFx2A=';

const AUTH_HEADER = `Basic ${typeof btoa !== 'undefined' ? btoa(`${PRIVATE_KEY}:`) : ''}`;

const BASE_URL = 'https://upload.imagekit.io/api/v1/files/upload';

export const uploadVendorImage = async (file: File, vendorId?: string) => {
  const formData = new FormData();
  formData.append('file', file as any);
  formData.append('fileName', `${Date.now()}-${file.name}`);
  formData.append('tags', `dreamevents,vendor${vendorId || ''}`);
  if (vendorId) formData.append('folder', `vendors/${vendorId}`);
  formData.append('useUniqueFileName', 'true');

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: AUTH_HEADER
    },
    body: formData
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Upload failed');
  return result.url;
};

export const uploadServiceImage = async (file: File, serviceId?: string) => {
  const formData = new FormData();
  formData.append('file', file as any);
  formData.append('fileName', `${Date.now()}-${file.name}`);
  formData.append('tags', `dreamevents,service${serviceId || ''}`);
  if (serviceId) formData.append('folder', `services/${serviceId}`);
  formData.append('useUniqueFileName', 'true');

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: AUTH_HEADER
    },
    body: formData
  });

  const result = await res.json();
  if (!res.ok) throw new Error(result.message || 'Upload failed');
  return result.url;
};

export default { uploadVendorImage, uploadServiceImage };
