import { z } from "zod"

const TokenResponse = z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    iat: z.number(),
    exp: z.number()
})


export const TokenSchema = {
    TokenResponse
}