import { FastifyInstance, FastifyServerOptions } from "fastify";


export function AuthRoutes(api: FastifyInstance, opts: FastifyServerOptions, done: () => void) {
    api.post<{
        Body: {
            client_id: string
            client_secret: string
            grant_type: 'authorization_code' | 'refresh_token'
            code: string
            refresh_token: string
        }
    }>('/token', (req, res) => {
        const body = req.body;
        console.log(body)
        // Accepter que application/x-www-form-urlencoded

        if (!body.grant_type) return res.status(400).send();

        switch (body.grant_type) {

            case 'authorization_code':
                if (!body.code) return res.status(400).send();
                break;

            case 'refresh_token':
                if (!body.refresh_token) return res.status(400).send();
                break;

            default:
                return res.status(400).send('Invalide grand_type');
        }

        return {
            access_token: 'accesTokenTest',
            token_type: 'Bearer',
            expires_in: 600000
        }
    });
    api.get<{
        Body: {
            access_token: string
        }
    }>('/me', (req, res) => {
        const body = req.body;
        console.log(body)

        return {
            userId: "test"
        }
    });
    done();
}