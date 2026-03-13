export const getSocketUrl = () => {
  return import.meta.env.VITE_API_URL || undefined;
};
