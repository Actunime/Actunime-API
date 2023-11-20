import JWT from 'jsonwebtoken';

interface code {
    userId: string;
}

export function echangeCode(code: string) {
    try {
        const decode = JWT.verify(code, process.env.TCODE as string);
        return createToken(decode);
    } catch (err) {
        throw 'Invalide code';
    }
}

export function createToken(withData: {}) {

    const access_token = JWT.sign(withData, process.env.TTCODE as string, { expiresIn: 60000 * 60 * 24 })
    const refresh_token = JWT.sign(withData, process.env.TTCODE as string, { expiresIn: 60000 * 60 * 24 * 365 })

    return {
        access_token: '',
        refresh_token: '',
        expires_in: ''
    }
}

export function refreshToken(refresh_token: string) {

}