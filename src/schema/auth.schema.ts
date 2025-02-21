import { z } from "zod"



const LoginBody = z.object({
    email: z.string().email(),
    password: z.string(),
    captcha: z.string()
})


export const AuthSchema = {
    LoginBody
}