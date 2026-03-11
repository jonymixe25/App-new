export const getSocketUrl = () => {
  let url = import.meta.env.VITE_API_URL || "";
  
  // If URL is empty, fallback to current origin
  if (!url) {
    return window.location.origin;
  }

  // Ensure URL has protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  // Remove trailing slash
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }

  return url;
};
