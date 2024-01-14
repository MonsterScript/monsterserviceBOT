import { CommandData } from "../../types";
import { Context } from "../../structures";
import * as crypto from "crypto";
import { ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { stockModel } from "../../databases/stock.model";

export const data: CommandData = {
	name: "taocode",
	description: "tạo code",
	options: [{
		name: "name",
		description: "tên sản phẩm",
		type: ApplicationCommandOptionType.String,
		autocomplete: true,
		required: true,
	}, {
		name: "code",
		description: "số lượng code",
		type: ApplicationCommandOptionType.Integer,
	}, {
		name: "amount",
		description: "số lượng sản phẩm mỗi code",
		type: ApplicationCommandOptionType.Integer,
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
	const codeAmount = ctx.interaction.options.getInteger("code") || 1;
	const amount = ctx.interaction.options.getInteger("amount") || 1;

	await ctx.sendDeferMessage(false);

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});

	const createcode = () => crypto.randomBytes(8).toString("base64url");

	const codes = [];
	for (let i = 0; i < codeAmount; i++) {
		let code = createcode();
		while (db.codeList.find(data => data.code === code) || codes.includes(code)) {
			code = createcode();
		}
		codes.push(code);
	}
	codes.map(code => db.codeList.push({ name, amount, code, active: true }));
	await db.save();

	ctx.sendFollowUp(
		`- Sản phẩm: **${name}**`
		+ `\n- Số lượng: **${amount}**`
		+ `\n- Code [${codeAmount}]:`
		+ "\n```"
		+ `\n${codes.join("\n")}`
		+ "```"
	);
}
