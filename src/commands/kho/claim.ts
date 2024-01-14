import { CommandData } from "../../types";
import { Context } from "../../structures";
import { Colors, Locale } from "discord.js";
import { stockModel } from "../../databases/stock.model";
import { serverModel } from "../../databases/server.model";

export const data: CommandData = {
	name: "claim",
	aliases: ["i"],
	description: "claim reward",
	descriptionLocalizations: {
		"vi": "Nhận phần thưởng (nếu có)",
	},
	nameLocalizations: {
		"vi": "nhan",
	},
};

export async function execute(ctx: Context) {
	await ctx.sendDeferMessage(false);
	const isVn = ctx.interaction.locale === Locale.Vietnamese;

	const inviteData = await ctx.client.invites.findInvite(ctx.author.id);
	const { total } = ctx.client.invites.getInvite(inviteData);

	if (total === 0)
		return ctx.sendFollowUp(
			isVn ? "Bạn chưa có phần thưởng nào để nhận cả."
				: "You don't have any reward to claim."
		);

	const stockDb = await stockModel.findOne({});

	// find reward with current invite
	const rewards = stockDb.inviteReward.filter(reward => total >= reward.amount);

	const rewardMsg = [];
	const productMsg = [];

	rewards.forEach(reward => {
		const stock = stockDb.stock.find(stock => stock.name === reward.name);
		if (!stock?.content)
			return rewardMsg.push(isVn ? "Không tìm thấy stock **" + reward.name + "**!"
				: "Stock **" + reward.name + "** not found!");

		if (stock.content.length < reward.amount)
			return rewardMsg.push(
				isVn ? `Kho hiện tại không đủ phần thưởng **${reward.name}**!`
					: `We don't have enough stock **${reward.name}** to claim!`);

		// Check claim
		const isClaimed = stockDb.rewardList.filter(reward => reward.userId === ctx.author.id).map(reward => reward.rewardId).includes(reward.id);
		if (isClaimed) return;

		stockDb.rewardList.push({
			userId: ctx.author.id,
			rewardId: reward.id,
		});

		const send = stock.content.slice(0, reward.amount);
		stockDb.stock[stockDb.stock.indexOf(stock)].content = stock.content.filter(line => !send.includes(line));
		productMsg.push({
			name: reward.name,
			content: send,
		});

		rewardMsg.push(isVn ? `Đã nhận phần thưởng **${reward.name}** (x${reward.amount})`
			: `You has been received **${reward.name}** (x${reward.amount})`);
	});

	if (!rewardMsg.length)
		return ctx.sendFollowUp(isVn ? "Bạn không có phần thưởng nào để nhận cả."
			: "You don't have any reward to claim.");


	ctx.sendFollowUp({
		embeds: [{
			author: { name: "REWARD", icon_url: ctx.user.displayAvatarURL() },
			description: rewardMsg.join("\n"),
			color: ctx.color.default,
			timestamp: new Date().toISOString(),
		}]
	});

	if (!productMsg.length) return;

	ctx.author.send(isVn ? "Đang tải sản phẩm vui lòng chờ..." : "Please wait a sec...").then(async msg => {
		await stockDb.save();

		const products = productMsg.map(product => product.name + "```" + product.content.join("\n") + "```\nTry it out and leave us feedback at: <#1154646236276723832> | <#1094985161055154179> \n[DOWNLOAD SPOOFER HERE](https://store.monsterservice.xyz/MonsterSpoofer.rar)").join("\n\n");

		msg.edit({
			content: "",
			embeds: [{
				author: { name: isVn ? "Monster Spoofer Free Trial Key" : "Monster Spoofer Free Trial Key" },
				description: products,
				timestamp: new Date().toISOString(),
				color: Colors.Blue,
			}]
		});

		const svDb = await serverModel.findOne({});
		if (!svDb) return;
		const redeemChannel = ctx.client.channels.cache.filter(c => c.isTextBased() && svDb.redeemId.includes(c.id));
		if (!redeemChannel.size) return;

		redeemChannel.each(channel => {
			if (channel.isTextBased()) channel.send({
				embeds: [{
					description: `${ctx.author.toString()} đã claim.`
						+ "\n\n" + products,
					color: Colors.Blue,
				}]
			});
		});
	}).catch(err => {
		ctx.client.logger.error(err.message);
		ctx.sendFollowUp(isVn ? "Không thể gửi tin nhắn cho bạn." : "I can't send the product to you.");
	});
}