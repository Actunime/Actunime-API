// import jwt from 'jwt-simple';

export function Captcha_validation(rep: string, token?: string) {
  const decoded = undefined; //jwt.decode(token, process.env.CAPTCHA_SECRET as string, undefined);
  const expired = true; // Date.now() - decoded.createdAt > 5 * 60 * 1000;

  const isValid = false; // decoded && !expired && decoded.rep === rep;

  return {
    valid: isValid,
    expired,
  };
}
