import { Invite } from "discord.js";
import { Bot } from "../../structures";

export async function execute(client: Bot, invite: Invite) {
	client.cachedInvites.delete(invite.code);
}