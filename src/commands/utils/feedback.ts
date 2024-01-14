import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType } from "discord.js";
import { serverModel } from "../../databases/server.model";

export const data: CommandData = {
	name: "feedback",
	description: "thiết lập kênh feedback",
	options: [{
		name: "channel",
		description: "id các kênh cách nhau 1 dấu cách",
		type: ApplicationCommandOptionType.String,
		required: true,
	}],
	command: { slash: true },
	whitelist: { admin: true },
};

export async function execute(ctx: Context) {
	const channelId = ctx.interaction.options.getString("channel");
	await ctx.sendDeferMessage(false);

	let db = await serverModel.findOne();
	if (!db) db = await serverModel.create({});

	db.feedbackId = channelId.split(" ");
	await db.save();

	ctx.sendFollowUp("Thiết lập kênh feedback thành công");
}
