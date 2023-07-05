import qr from 'qr.js';

export const generateQr = (value: string) => {
  return qr(value).modules;
};
