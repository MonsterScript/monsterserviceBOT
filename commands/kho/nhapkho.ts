import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType, AutocompleteInteraction, Colors } from "discord.js";
import axios from "axios";
import { stockModel } from "../../databases/stock.model";
import { serverModel } from "../../databases/server.model";

export const data: CommandData = {
	name: "nhapkho",
	description: "nhập hàng",
	options: [{
		name: "name",
		description: "tên sản phẩm",
		type: ApplicationCommandOptionType.String,
		required: true,
		autocomplete: true,
	}, {
		name: "file",
		description: "tệp chứa dữ liệu",
		type: ApplicationCommandOptionType.Attachment,
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
	await ctx.sendDeferMessage(false);

	const name = ctx.interaction.options.getString("name");
	const attachment = ctx.interaction.options.getAttachment("file");
	const res = await axios({ url: attachment.url });

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});

	const content = res.data?.split("\n").filter(cont => cont);
	if (!content)
		return ctx.sendFollowUp("Có gì đó sai sai vui lòng thử lại sau");

	const data = { name, content };
	const stock = db.stock.findIndex(data => data.name === name);
	if (stock !== -1) {
		db.stock[stock].content = db.stock[stock].content.concat(content);
	} else db.stock.push(data);
	await db.save();

	ctx.sendFollowUp("Upload thành công");

	const svDb = await serverModel.findOne({});
	if (!svDb) return;
	const stockChannel = ctx.client.channels.cache.filter(c => c.isTextBased() && svDb.stockId.includes(c.id));
	if (!stockChannel.size) return;

	stockChannel.each(channel => {
		if (channel.isTextBased()) channel.send({
			embeds: [{
				description: `${ctx.author.toString()} đã nhập kho:`
					+ "\n```\n"
					+ content.join("\n")
					+ "```",
				color: Colors.Blue,
			}]
		});
	});
}
