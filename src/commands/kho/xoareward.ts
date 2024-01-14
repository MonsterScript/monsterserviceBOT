import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { stockModel } from "../../databases/stock.model";

export const data: CommandData = {
	name: "xoareward",
	description: "xoá reward",
	options: [{
		name: "id",
		description: "id invite reward",
		type: ApplicationCommandOptionType.String,
		autocomplete: true,
		required: true,
	}],
	command: { slash: true },
	whitelist: { admin: true },
};

export async function autoComplete(interaction: AutocompleteInteraction) {
	const db = await stockModel.findOne();
	if (!db) return;

	const focusedOption = interaction.options.getFocused(true);
	if (focusedOption.name === "id") {
		const filtered = db.inviteReward.filter(choice => String(choice.id).startsWith(focusedOption.value));
		const data = filtered.map(choice => ({ value: String(choice.id), name: `ID: ${choice.id} - Invites: ${choice.inviteAmount} - Stock: ${choice.name} (x${choice.amount})` }));
		interaction.respond(data);
	}
}

export async function execute(ctx: Context) {
	const id = ctx.interaction.options.getString("id");

	await ctx.sendDeferMessage(false);

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});
	if (!db.rewardId) db.rewardId = 0;

	const rewardIndex = db.inviteReward.findIndex(reward => String(reward.id) === id);
	if (rewardIndex === -1)
		return ctx.sendFollowUp("Không tìm thấy reward này.");

	db.inviteReward.splice(rewardIndex, 1);
	await db.save();

	ctx.sendFollowUp(`Đã xoá reward **ID-${id}**.`);
}
