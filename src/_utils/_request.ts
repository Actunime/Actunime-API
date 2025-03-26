import { FastifyRequest } from 'fastify';
import { approuvedClient } from './_authClients';
import { UAParser } from 'ua-parser-js';
import geolite from 'geoip-lite';
import { APIError } from '../_lib/error';

function getDevice(req: FastifyRequest) {
  const { 'user-agent': userAgent } = req.headers;
  const userInfo = new UAParser(userAgent as string | undefined);
  const browser = userInfo.getBrowser();
  const os = userInfo.getOS();
  const location = geolite.lookup(req.ip);
  return (
    browser?.name &&
    os?.name &&
    browser.name +
      ' ' +
      os.name +
      `${location ? `(${location?.city}, ${location?.country})` : ''}`
  );
}

function getClientId<T extends boolean = false>(
  req: FastifyRequest,
  noError?: T
): T extends true ? string | null : string {
  const { 'x-client-id': clientId = '', origin, referer } = req.headers;
  if (!approuvedClient[(origin || referer) as keyof typeof approuvedClient]) {
    if (!noError) throw new APIError('Invalid CLIENT', 'BAD_REQUEST');
    return null as T extends true ? string | null : string;
  }

  return clientId as string;
}

function getToken<T extends boolean = false>(
  req: FastifyRequest,
  noError?: T
): T extends true ? string | null : string {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    if (!noError)
      throw new APIError("Jeton d'autorisation non fourni", 'UNAUTHORIZED');
    return null as T extends true ? string | null : string;
  }
  return token;
}

export const RequestUtil = {
  getDevice,
  getClientId,
  getToken,
};
