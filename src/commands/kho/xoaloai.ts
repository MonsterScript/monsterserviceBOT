import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { stockModel } from "../../databases/stock.model";

export const data: CommandData = {
	name: "xoaloai",
	description: "xoá loại hàng",
	options: [{
		name: "name",
		description: "tên loại hàng",
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
	if (focusedOption.name === "name") {
		const filtered = db.productType.filter(choice => choice.startsWith(focusedOption.value));
		const data = filtered.map(choice => ({ name: choice, value: choice }));
		interaction.respond(data);
	}
}

export async function execute(ctx: Context) {
	const name = ctx.interaction.options.getString("name");

	await ctx.sendDeferMessage(false);

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});
	if (!db.productType) db.productType = [];

	const stock = db.productType.find(n => name === n);
	if (!stock)
		return ctx.sendFollowUp("Tên loại hàng này không tồn tại!");

	db.productType = db.productType.filter(prod => prod !== name);
	await db.save();

	ctx.sendFollowUp(`Đã xoá loại hàng **${name}**!`);
}
