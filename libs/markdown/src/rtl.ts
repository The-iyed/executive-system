export const isRtl = (text: string): boolean => {
  const rtlPattern = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlPattern.test(text);
};

export const getTextDirection = (text: string): 'ltr' | 'rtl' => {
  return isRtl(text) ? 'rtl' : 'ltr';
};







