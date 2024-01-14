import { CommandData } from "../../types";
import { Bot, Context } from "../../structures";
import { stockModel } from "../../databases/stock.model";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, Locale, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { serverModel } from "../../databases/server.model";

export const data: CommandData = {
	name: "redeem",
	description: "Redeem code to receive the product",
	nameLocalizations: {
		vi: "nhapcode",
	},
	descriptionLocalizations: {
		vi: "nhập code để nhận sản phẩm",
	},
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
	const isVn = interaction.locale === Locale.Vietnamese;

	await interaction.deferReply({ ephemeral: true });

	let db = await serverModel.findOne();
	if (!db) db = await serverModel.create({});

	const feedChannel = interaction.client.channels.cache.filter(c => c.isTextBased() && db.feedbackId.includes(c.id));
	if (!feedChannel.size)
		return interaction.followUp({
			ephemeral: true,
			content: isVn ? "Không tim thấy kênh đánh giá." : "Feedback channel not found.",
		});

	let stars = "";
	for (let i = 0; i < +star; i++)
		stars += client.emotes.star + " ";

	const feedback = interaction.fields.fields.map(f => f.value)[0] || isVn ? "Không có lời nhắn" : "No message provided";

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
	interaction.followUp(isVn ? "Feedback của bạn đã được gửi" : "Your feedback was sent!");
}

export async function buttonRun(interaction: ButtonInteraction) {
	const client = interaction.client as Bot;
	const [, choice, star] = interaction.customId.split(".");
	const isVn = interaction.locale === Locale.Vietnamese;

	switch (choice) {
		case "star":
			await interaction.message.edit({ components: [] });
			interaction.reply({
				content: isVn ?
					`Bạn đã chọn **${star}** ${client.emotes.star}! Hãy bấm nút **Feedback** để gửi đánh giá.` :
					`You choosed **${star}** ${client.emotes.star}! Click **Feedback** button to send your feedback.`,
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
						.setLabel(isVn ? "Nội dung" : "Content")
				)
			);
			interaction.showModal(modal);
			break;
		}
	}
}

export async function execute(ctx: Context) {
	const isVn = ctx.interaction.locale === Locale.Vietnamese;

	const code = ctx.interaction.options.getString("code");
	if (!code) return ctx.sendMessage(isVn ? "Vui lòng nhập code." : "Please provide the code to redeem.");

	await ctx.sendDeferMessage(true);

	let db = await stockModel.findOne();
	if (!db) db = await stockModel.create({});

	const validCode = db.codeList.find(data => data.code === code && data.active);
	if (!validCode)
		return ctx.sendFollowUp(isVn ? "Code không hợp lệ." : "Invalid code.");

	// Check stock
	const stock = db.stock.find(data => data.name === validCode.name);
	if (!stock)
		return ctx.sendFollowUp(isVn ? "Không tìm thấy sản phẩm này." : "Product not found.");

	if (stock.content.length < validCode.amount)
		return ctx.sendFollowUp(isVn ? "Kho không đủ số lượng để gửi , vui lòng báo cáo với với ADMIN" : "We don't have enough stock to send! please report to ADMIN");

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

	let description = `- **THANK YOU FOR YOUR TRUST AND PURCHASE** \n**Product : ${validCode.name}**\n- [Download SP00FER](https://store.monsterservice.xyz/MonsterSpooferEN.rar) \nCreate a <#1094985160585396251> if you need support with anything\n \nYour Key : `
		+ "\n```"
		+ send.join("\n")
		+ "```";

	if (isVn) description = `- **CẢM ƠN ĐÃ TIN TƯỞNG VÀ MUA HÀNG** \n- **Sản Phẩm : ${validCode.name} **\n- [Download SP00FER](https://store.monsterservice.xyz/MonsterSpooferVN.rar) \n<#1154046863369060443> nếu bạn cần hỗ trợ\n \n**Key Của Bạn : **`
		+ "\n```"
		+ send.join("\n")
		+ "```";

	let embeds = [{
		description,
		color: Colors.Blue,
		footer: {
			text: "Please select the number of stars below to rate",
			icon_url: "https://cdn.discordapp.com/attachments/1085881559657238608/1189192672288706590/VN.png"
		},
		image: {
			url: "https://cdn.discordapp.com/attachments/1085881559657238608/1190897901161947219/banned2.png"
		}
	}];

	// ==================================================
	// loai1
	if (stock?.loai === "loai1" && db.productType?.includes(stock?.loai || "") === true) {
		description = `123 - **THANK YOU FOR YOUR TRUST AND PURCHASE** \n**Product : ${validCode.name}**\n- [Download SP00FER](https://store.monsterservice.xyz/MonsterSpooferEN.rar) \nCreate a <#1094985160585396251> if you need support with anything\n \nYour Key : `
			+ "\n```"
			+ send.join("\n")
			+ "```";

		if (isVn) description = `123 - **CẢM ƠN ĐÃ TIN TƯỞNG VÀ MUA HÀNG** \n- **Sản Phẩm : ${validCode.name} **\n- [Download SP00FER](https://store.monsterservice.xyz/MonsterSpooferVN.rar) \n<#1154046863369060443> nếu bạn cần hỗ trợ\n \n**Key Của Bạn : **`
			+ "\n```"
			+ send.join("\n")
			+ "```";

		embeds = [{
			description,
			color: Colors.Blue,
			footer: {
				text: "123 Please select the number of stars below to rate",
				icon_url: "https://cdn.discordapp.com/attachments/1085881559657238608/1189192672288706590/VN.png"
			},
			image: {
				url: "https://cdn.discordapp.com/attachments/1085881559657238608/1190897901161947219/banned2.png"
			}
		}];
	}

	ctx.author.send({
		embeds,
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
			stars
		)]
	}).then(async () => {
		ctx.sendFollowUp(isVn ? "Kích hoạt code thành công!" : "You have activated the code and received the product successfully!");

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
		ctx.sendFollowUp(isVn ? "Không thể gửi tin nhắn cho bạn." : "I can't send the product to you.");
	});
}
