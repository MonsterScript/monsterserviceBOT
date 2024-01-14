import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { stockModel } from "../../databases/stock.model";

export const data: CommandData = {
	name: "xoacode",
	description: "xoá code",
	options: [{
		name: "name",
		description: "tên sản phẩm",
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
		const filtered = db.stock.filter(choice => choice.name.startsWith(focusedOption.value));
		const data = filtered.map(choice => ({ name: choice.name, value: choice.name }));
		interaction.respond(data);
	}
}

export async function execute(ctx: Context) {
	const name = ctx.interaction.options.getString("name");

	await ctx.sendDeferMessage(false);

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});

	const anyCodes = db.codeList.filter(code => code.active && code.name === name);
	if (anyCodes.length === 0)
		return ctx.sendFollowUp("Không có code nào để xoá cả.");

	db.codeList = db.codeList.filter(code => code.name !== name);
	await db.save();

	ctx.sendFollowUp("Đã xoá tất cả code của kho **" + name + "**.");
}
