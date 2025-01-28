export const serverOrigin =
  import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.ENV?.API_URL);
export const wsServerOrigin =
  import.meta.env.VITE_COLLAB_URL || (typeof window !== 'undefined' && window.ENV?.COLLAB_URL);
