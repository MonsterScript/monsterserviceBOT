import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { stockModel } from "../../databases/stock.model";

export const data: CommandData = {
	name: "xemkho",
	description: "xem kho",
	options: [{
		name: "name",
		description: "tên sản phẩm",
		type: ApplicationCommandOptionType.String,
		required: true,
		autocomplete: true,
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
	await ctx.sendDeferMessage(false);

	const name = ctx.interaction.options.getString("name");

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});

	const stock = db.stock.find(data => data.name === name);
	if (!stock || !stock.content.length)
		return ctx.sendFollowUp("Không có sản phẩm nào cả.");

	ctx.sendFollowUp(
		`- Sản phẩm: **${name}**`
        + "\n```\n"
        + stock.content.join("\n")
        + "```"
	);
}
