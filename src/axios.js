import axios from 'axios';
import { toast } from 'react-hot-toast';

const axiosMerchant = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

axiosMerchant.interceptors.request.use((config) => {
    const token = localStorage.getItem('ACCESS_TOKEN');
    const workspaceKey = localStorage.getItem('X-Workspace-Key');
    const workspaceType = localStorage.getItem('X-Workspace-Type');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Only send workspace headers if both are present and valid
    // workspaceType must be a valid model class name
    const validWorkspaceTypes = [
        'App\\Models\\Hub',
        'App\\Models\\Station',
        'App\\Models\\Branch'
    ];
    
    if (workspaceKey && workspaceType && validWorkspaceTypes.includes(workspaceType)) {
        config.headers['X-Workspace-Key'] = workspaceKey;
        config.headers['X-Workspace-Type'] = workspaceType;
    }

    return config;
});

axiosMerchant.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.log('401 occurred');
            localStorage.removeItem('ACCESS_TOKEN');
            localStorage.removeItem('X-Workspace-Key');
            localStorage.removeItem('X-Workspace-Type');
            window.location.reload();
            toast.success("Logged out");
        }
        return Promise.reject(error);
    }
);

export default axiosMerchant;