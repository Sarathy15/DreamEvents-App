// Configuration and authentication parameters for ImageKit

// Initialize ImageKit instance for use with the frontend SDK
export const imagekitConfig = {
    publicKey: "public_hDU35azqTT4ORveYdYqdpFv13Bo=",
    urlEndpoint: "https://ik.imagekit.io/dreamevents"
};

// Function to get authentication parameters from backend
export const getAuthenticationParameters = async () => {
    try {
        // Get authentication parameters from your backend
        const response = await fetch('/api/imagekit/auth');
        if (!response.ok) {
            throw new Error('Failed to get ImageKit authentication parameters');
        }
        const authParams = await response.json();
        
        return {
            signature: authParams.signature,
            expire: authParams.expire,
            token: authParams.token
        };
    } catch (error) {
        console.error('Error getting authentication parameters:', error);
        throw error;
    }
};