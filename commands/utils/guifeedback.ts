import { CommandData } from "../../types";
import { Bot, Context } from "../../structures";
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from "discord.js";
import { serverModel } from "../../databases/server.model";

export const data: CommandData = {
	name: "guifeedback",
	description: "gửi feedback",
	options: [{
		name: "user",
		description: "user",
		type: ApplicationCommandOptionType.User,
		required: true,
	}],
	command: { slash: true },
	whitelist: { admin: true },
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
			content: "Feedback channel not found.",
		});

	let stars = "";
	for (let i = 0; i < +star; i++)
		stars += client.emotes.star + " ";

	const feedback = interaction.fields.fields.map(f => f.value)[0] || "No message provided";

	feedChannel.each(channel => {
		if (channel.isTextBased()) channel.send({
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
}

export async function buttonRun(interaction: ButtonInteraction) {
	const client = interaction.client as Bot;
	const [, choice, star] = interaction.customId.split(".");

	switch (choice) {
	case "star":
		await interaction.message.edit({ components: [] });
		interaction.reply({
			content: `You choose **${star}** ${client.emotes.star}! Press the button **Feedback** to submit a review.`,
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
					.setPlaceholder("+1 Legit")
					.setRequired(false)
					.setLabel("Content rated")
			)
		);
		interaction.showModal(modal);
		break;
	}
	}
}

export async function execute(ctx: Context) {
	const user = ctx.interaction.options.getUser("user");

	const stars: ButtonBuilder[] = [];
	for (let i = 0; i < 5; i++) {
		stars.push(
			new ButtonBuilder()
				.setCustomId(`${data.name}.star.${i + 1}`)
				.setLabel(`${i + 1} ${ctx.emotes.star}`)
				.setStyle(ButtonStyle.Secondary)
		);
	}

	user.send({
		embeds: [{
			description: "[VN] Cảm ơn bạn đã sử dụng dịch vụ . Giúp chúng tôi một feedback nhé \n[EN] Thank you for using the service. Please help us with feedback",
			color: Colors.Blue,
		}],
		components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
			stars
		)]
	}).then(() => {
		ctx.sendMessage("Feedback sent successfully.");
	}).catch(err => {
		ctx.client.logger.error(err.message);
		ctx.sendMessage("Feedback cant sent");
	});
}
