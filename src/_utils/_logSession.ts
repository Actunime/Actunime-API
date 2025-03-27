import { MessageBuilder } from 'discord-webhook-node';
import { FastifyReply, FastifyRequest } from 'fastify';
import { APIDiscordWebhook } from './_discordWebhook';
import { IUser } from '@actunime/types';

type ILog = {
  name: string;
  content: string | { name: string; content?: string }[];
};

export default class LogSession {
  private logs: ILog[] = [];
  private user: IUser | null = null;
  constructor(user: IUser | null = null) {
    this.user = user;
  }

  add(name: string, content: string | { name: string; content?: string }[]) {
    this.logs.push({ name, content });
  }

  async commit() {
    const groupeLogs: ILog[][] = [];
    const groupe: ILog[] = [];

    for (let i = 0; i < this.logs.length; i++) {
      groupe.push(this.logs[i]);
      if (groupe.length === 25) {
        groupeLogs.push(groupe);
        groupe.splice(0, 25);
      } else if (!this.logs[i + 1]) groupeLogs.push(groupe);
    }

    for (let i = 0; i < groupeLogs.length; i++) {
      const embed = new MessageBuilder();
      for (let y = 0; y < groupeLogs[i].length; y++) {
        const log = groupeLogs[i][y];
        if (typeof log.content === 'string')
          embed.addField(log.name, log.content);
        else
          embed.addField(
            log.name,
            log.content
              .map((x) => `${x.name}: \`${x.content ? x.content : '???'}\``)
              .join('\n')
          );
      }
      if (this.user)
        embed.setFooter(`Auteur: ${this.user?.displayName} (${this.user?.id})`);

      embed.setTimestamp();

      await APIDiscordWebhook.send(embed);
    }
  }
}

export function AddLogSession(
  req: FastifyRequest,
  _res: FastifyReply,
  next: () => void
) {
  req.logSession = new LogSession(req.user);
  next();
}

export async function EndLogSession(req: FastifyRequest) {
  if (req.logSession && !req.isTesting) await req.logSession.commit();
  req.logSession = undefined;
}
