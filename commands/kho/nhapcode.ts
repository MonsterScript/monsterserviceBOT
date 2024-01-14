import { CommandData } from "../../types";
import { Bot, Context } from "../../structures";
import { stockModel } from "../../databases/stock.model";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { serverModel } from "../../databases/server.model";

export const data: CommandData = {
	name: "nhapcode",
	description: "nhập code",
	options: [{
		name: "code",
		description: "code",
		type: ApplicationCommandOptionType.String,
		required: true,
	}],
	command: { slash: true },
};

export async function modalRun(interaction: ModalSubmitInteraction) {
	const client = interaction.client as Bot;
	const [, , star] = interaction.customId.split(".");

	await interaction.deferReply({ ephemeral: true });

	let db = await serverModel.findOne();
	if (!db) db = await serverModel.create({});

	const feedChannel = interaction.client.channels.cache.filter(c => c.isTextBased() && db.feedbackId.includes(c.id));
	if (!feedChannel.size)
		return interaction.followUp({
			ephemeral: true,
			content: "Không tim thấy kênh đánh giá.",
		});

	let stars = "";
	for (let i = 0; i < +star; i++)
		stars += client.emotes.star + " ";

	const feedback = interaction.fields.fields.map(f => f.value)[0] || "No message provided";

	const task = feedChannel.map(async channel => {
		if (channel.isTextBased()) await channel.send({
			embeds: [{
				author: { name: `${interaction.user.displayName}`, icon_url: interaction.user.displayAvatarURL(), },
				fields: [{
					name: "Stars",
					value: stars,
				}, {
					name: "Message",
					value: feedback,
				}],
				timestamp: new Date().toISOString(),
				color: Colors.Blue,
			}]
		});
	});

	await Promise.all(task);

	interaction.message.delete();
	interaction.followUp("Feedback của bạn đã được gửi");
}

export async function buttonRun(interaction: ButtonInteraction) {
	const client = interaction.client as Bot;
	const [, choice, star] = interaction.customId.split(".");

	switch (choice) {
	case "star":
		await interaction.message.edit({ components: [] });
		interaction.reply({
			content: `Bạn đã chọn **${star}** ${client.emotes.star}! Hãy bấm nút **Feedback** để gửi đánh giá.`,
			components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`${data.name}.feedback.${star}`)
					.setLabel("Feedback")
					.setStyle(ButtonStyle.Primary)
			)],
		});
		break;
	case "feedback": {
		const modal = new ModalBuilder()
			.setTitle("Feedback")
			.setCustomId(`${data.name}.modal.${star}`);

		modal.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId(`${data.name}.modal.${star}`)
					.setStyle(TextInputStyle.Short)
					.setPlaceholder("+1 Legit Service")
					.setRequired(false)
					.setLabel("Nội dung đánh giá")
			)
		);
		interaction.showModal(modal);
		break;
	}
	}
}

export async function execute(ctx: Context) {
	const code = ctx.interaction.options.getString("code");
	if (!code) return ctx.sendMessage("Vui lòng nhập code.");

	await ctx.sendDeferMessage(true);

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});

	const validCode = db.codeList.find(data => data.code === code && data.active);
	if (!validCode)
		return ctx.sendFollowUp("Code không hợp lệ.");

	// Check stock
	const stock = db.stock.find(data => data.name === validCode.name);
	if (!stock)
		return ctx.sendFollowUp("Không tìm thấy sản phẩm này");

	if (stock.content.length < validCode.amount)
		return ctx.sendFollowUp("Kho không đủ số lượng để gửi");

	const send = stock.content.slice(0, validCode.amount);

	db.stock[db.stock.indexOf(stock)].content = stock.content.filter(line => !send.includes(line));

	db.codeList[db.codeList.indexOf(validCode)].active = false;
	await db.save();

	const stars: ButtonBuilder[] = [];
	for (let i = 0; i < 5; i++) {
		stars.push(
			new ButtonBuilder()
				.setCustomId(`${data.name}.star.${i + 1}`)
				.setLabel(`${i + 1} ${ctx.emotes.star}`)
				.setStyle(ButtonStyle.Secondary)
		);
	}

	ctx.author.send({
		embeds: [{
			description: "- **Nội dung đơn hàng** \n [Thông Tin Và Sử Dụng](http://home.monsterservice.xyz/)  "
				+ "\n```"
				+ send.join("\n")
				+ "```",
			color: Colors.Blue,
		}],
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
			stars
		)]
	}).then(async () => {
		ctx.sendFollowUp("Kích hoạt code thành công!");

		const svDb = await serverModel.findOne({});
		if (!svDb) return;
		const redeemChannel = ctx.client.channels.cache.filter(c => c.isTextBased() && svDb.redeemId.includes(c.id));
		if (!redeemChannel.size) return;

		redeemChannel.each(channel => {
			if (channel.isTextBased()) channel.send({
				embeds: [{
					description: `${ctx.author.toString()} đã nhập code ${validCode.name} thành công, đơn hàng:`
						+ "\n```\n"
						+ send.join("\n")
						+ "```",
					color: Colors.Blue,
				}]
			});
		});
	}).catch(err => {
		ctx.client.logger.error(err.message);
		ctx.sendFollowUp("Không thể gửi tin nhắn cho bạn");
	});
}
