import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType, AutocompleteInteraction } from "discord.js";
import { stockModel } from "../../databases/stock.model";

export const data: CommandData = {
	name: "taoreward",
	description: "tạo reward",
	options: [{
		name: "name",
		description: "tên sản phẩm",
		type: ApplicationCommandOptionType.String,
		autocomplete: true,
		required: true,
	}, {
		name: "invite",
		description: "số lượt invite",
		type: ApplicationCommandOptionType.Integer,
		required: false,
	}, {
		name: "amount",
		description: "số lượng sản phẩm cho lượt invite này",
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
	const inviteAmount = ctx.interaction.options.getInteger("invite") || 1;
	const amount = ctx.interaction.options.getInteger("amount") || 1;

	await ctx.sendDeferMessage(false);

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});
	if (!db.rewardId) db.rewardId = 0;

	const stock = db.stock.find(stock => stock.name === name);
	if (!stock)
		return ctx.sendFollowUp("Không tìm thấy sản phẩm này.");

	db.rewardId++;
	db.inviteReward.push({
		id: db.rewardId, inviteAmount, amount, name,
	});

	await db.save();

	ctx.sendFollowUp(
		`**ID-${db.rewardId}**`
		+ `\n- Sản phẩm: **${name}**`
		+ `\n- Số lượng: **${amount}**`
		+ `\n- Invite: **${inviteAmount}**`
	);
}
