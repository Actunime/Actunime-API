


import { AccessTokenModel } from "@actunime/mongoose-models";
import { FastifyRequest, FastifyReply } from "fastify";
import { UAParser } from "ua-parser-js";
import geolite from 'geoip-lite';

export const GetLoggedDevices = async (
    req: FastifyRequest,
    res: FastifyReply,
) => {
    const { "user-agent": userAgent } = req.headers;
    const userInfo = new UAParser(userAgent as string | undefined);
    const browser = userInfo.getBrowser();
    const os = userInfo.getOS();
    const location = geolite.lookup(req.ip);
    const device = browser?.name && os?.name && browser.name + " " + os.name + `${location ? `(${location?.city}, ${location?.country})` : ""}`;

    const user = req.currentUser;
    if (!user) return res.status(401).send({ error: "Unauthorized" });

    const accesToken = await AccessTokenModel.find({ userId: user.id });

    if (accesToken) {
        const devices = accesToken.map(a => ({
            name: a.device,
            lastActivity: a.lastActivity,
            current: a.token === req.headers.authorization?.split(" ")[1]
        }));
        return res.status(200).send({ devices, currentDevice: device });
    }

    return res.status(404).send({ devices: [] });
}
