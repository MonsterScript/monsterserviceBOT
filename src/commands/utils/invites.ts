import { CommandData } from "../../types";
import { Context } from "../../structures";
import { Locale } from "discord.js";

export const data: CommandData = {
	name: "invites",
	aliases: ["i"],
	description: "check your invites",
	descriptionLocalizations: {
		"vi": "xem invites của bạn",
	},
	command: { slash: true },
};

export async function execute(ctx: Context) {
	await ctx.sendDeferMessage(false);

	const inviteData = await ctx.client.invites.findInvite(ctx.author.id);
	const invData = ctx.client.invites.getInvite(Object(inviteData));

	let msg = `Bạn hiện có **${invData.total}** lời mời (**${invData.rejoin}** rejoins, **${invData.fake}** fakes)`;
	if (ctx.interaction.locale !== Locale.Vietnamese)
		msg = `You currently have **${invData.total}** invites (**${invData.rejoin}**, rejoins, **${invData.fake}** fakes)`;

	ctx.sendFollowUp({
		embeds: [{
			author: { name: `${ctx.member.displayName}`, icon_url: ctx.member.displayAvatarURL() },
			description: msg,
			color: ctx.color.default,
			timestamp: new Date().toISOString(),
		}]
	});
}
