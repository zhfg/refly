export const serverOrigin =
  (typeof window !== 'undefined' && window.ENV?.API_URL) || import.meta.env.VITE_API_URL;
export const wsServerOrigin =
  (typeof window !== 'undefined' && window.ENV?.COLLAB_URL) || import.meta.env.VITE_COLLAB_URL;

export const subscriptionEnabled =
  (typeof window !== 'undefined' && window.ENV?.SUBSCRIPTION_ENABLED) ||
  import.meta.env.VITE_SUBSCRIPTION_ENABLED;
