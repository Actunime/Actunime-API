import { z } from "zod";


const StartResetPasswordBody = z.object({
    email: z.string().email(),
    captcha: z.string()
})

const PasswordCodeBody = z.object({
    email: z.string().email(),
    code: z.string().min(6).max(6)
})

const ResetPasswordBody = z.object({
    newPassword: z.string()
}).merge(PasswordCodeBody)

const ResetPasswordWithOldPassword = z.object({
    password: z.string(),
    newPassword: z.string(),
    captcha: z.string()
})

export const AccountSchema = {
    StartResetPasswordBody,
    ResetPasswordBody,
    PasswordCodeBody,
    ResetPasswordWithOldPassword
}