export const optimizeCloudinaryMediaUrl = (url?: string, mediaType?: string): string => {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;

  const transform = mediaType === "video" ? "f_auto,q_auto:good,vc_auto" : "f_auto,q_auto:good";
  return url.replace("/upload/", `/upload/${transform}/`);
};

