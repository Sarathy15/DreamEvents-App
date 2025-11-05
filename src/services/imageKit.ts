export const uploadImage = async (file: File): Promise<string> => {
    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `${Date.now()}-${file.name}`);
        formData.append('tags', 'dream-events');
        formData.append('useUniqueFileName', 'true');

        // Upload directly to ImageKit using their upload API
        const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${btoa(`private_X3la6pcXa6oxhA9mDIQl6FFFx2A=:`)}`,
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to upload image');
        }

        return result.url;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
};