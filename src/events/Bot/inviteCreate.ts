import { Guild, Invite } from "discord.js";
import { Bot } from "../../structures";

export async function execute(client: Bot, invite: Invite) {
	const guild = invite.guild as Guild;
	await guild.invites.fetch();

	client.cachedInvites.set(invite.code, {
		uses: invite.uses,
		user: invite.inviter,
		code: invite.code,
	});
}