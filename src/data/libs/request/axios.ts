import { Constant } from '@/data/constant';
import axios from 'axios';
import { toast } from 'sonner';

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: '' + '/api/' + Constant.API_VERSION, // Set your API base URL
  timeout: 20000, // Request timeout in milliseconds
});

let isRefreshing = false;
let refreshSubscribers: ((token: string, err?: any) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string, err: any) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string, err?: any) => {
  refreshSubscribers.forEach((cb) => cb(token, err));
  refreshSubscribers = [];
};

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // const app = useApp();

    // Locale
    // const lang = app.getLocaleValue();
    // if (lang) {
    //   config.headers['x-lang'] = lang == 'zh-Hans' ? 'zh' : lang;
    // }
    // // Add authorization token to headers (if available)
    // const token = app.getAccessToken();
    // if (token) {
    //   config.headers['Authorization'] = `Bearer ${token}`;
    // }

    // config.headers['ngrok-skip-browser-warning'] = '69420'

    // config.headers['tenant_secret_key'] = '9c9a6bfffbf65c8c78bb82c8db0c9e27';
    // config.headers['tenant_secret_key'] = 'secr';

    return config; // Return the config to continue the request
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle successful response (can add additional logic here)
    return response; // Return the response
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 403) {
    }
    const isRefreshTokenRoute = originalRequest.url?.includes('/auth/refreshToken');
    // Handle errors globally (e.g., handle 401 errors for unauthorized access)
    if (error.response && error.response.status === 401 && !originalRequest._retry && !isRefreshTokenRoute) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token, err) => {
            if (err) return reject(err); // ensure error propagates
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      try {
        isRefreshing = true;
        originalRequest._retry = true;

        // Attempt to refresh token
        // const newToken = await useRefreshToken(app.getRefreshToken()?.toString() || '');

        // app.setToken(newToken);

        // if (newToken) {
        //   onTokenRefreshed(newToken.token);

        //   // Update default Authorization header
        //   originalRequest.headers.Authorization = `Bearer ${newToken.token}`;

        //   return axiosInstance(originalRequest);
        // }
      } catch (refreshError: any) {
        if (
          ['THE_ACCOUNT_HAS_BEEN_RESET_PASSWORD', 'NOT_ALLOW_MULTI_DEVICE'].includes(error.response?.data?.errorCode)
        ) {
          // if( ["THE_ACCOUNT_HAS_BEEN_RESET_PASSWORD", "NOT_ALLOW_MULTI_DEVICE"].includes(refreshError.response?.data?.errorCode) ) {
          onTokenRefreshed('', error); // notify all subscribers of failure
          return Promise.reject(error);
        }
        const message = refreshError?.response?.data?.message || refreshError?.message || 'Unknown error';
        toast.error(message);

        // app.logout();
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error); // Propagate the error to the calling function
  }
);

export default axiosInstance;
