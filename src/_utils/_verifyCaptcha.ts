// import fetch from "node-fetch";

export const HCaptchaIsValid = async (token: string): Promise<boolean> => {
    try {
        const req = await fetch("https://api.hcaptcha.com/siteverify", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `secret=${process.env.HCAPTCHA_SECRET_KEY}&response=${token}&sitekey=${process.env.HCAPTCHA_SITE_KEY}`,
        })

        const res = await req.json() as any || { success: false };

        return res.success || false;
    } catch (err) {
        console.error(err);
        return false;
    }
}