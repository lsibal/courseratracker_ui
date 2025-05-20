export const validateCourseraUrl = (url: string): boolean => {
  if (!url) return true; // Allow empty input since it's optional
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'coursera.org' || 
           urlObj.hostname === 'www.coursera.org' ||
           urlObj.hostname === 'https://www.coursera.org' ||
           urlObj.hostname.endsWith('.coursera.org');
  } catch {
    return false; // Invalid URL format
  }
};