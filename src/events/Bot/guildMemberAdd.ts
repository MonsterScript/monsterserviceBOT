import { Colors, GuildMember } from "discord.js";
import { Bot } from "../../structures";
import { serverModel } from "../../databases/server.model";
import { inviteModel } from "../../databases/invite.model";

export async function execute(client: Bot, member: GuildMember) {
	let inviteDb = await inviteModel.findOne({});
	if (!inviteDb) inviteDb = await inviteModel.create({});
	if (!inviteDb.invites) inviteDb.invites = [];

	if (!member.guild.members.me.permissions.has("ManageGuild"))
		return client.logger.error("Bot không có quyền ManageGuild tại server" + member.guild.name);

	await member.guild.invites.fetch();
	const guildInvites = member.guild.invites.cache;
	const cachedInvites = client.cachedInvites;

	const invite = guildInvites.find(inv => cachedInvites?.get(inv.code)!.uses < inv.uses!);
	let description = "Không rõ người này vào server như thế nào.";

	const handleInvites = async () => {
		const { vanityURLCode } = member.guild;
		if (vanityURLCode)
			description = `This person joined using the vanity link \`${member.guild.vanityURLCode}\`| ${member.guild.name}`;
		else {
			const updateInvite = async () => {
				const inviter = cachedInv.user;

				const inviteData = await client.invites.findInvite(inviter.id, inviteDb);
				const index = inviteDb.invites.indexOf(inviteData);

				const isFakeInvite = (Date.now() - member.user.createdTimestamp) < 30 * 24 * 60 * 60 * 1000;
				const isRejoinInvite = inviteDb.joined.includes(member.id);
				const isInviteAuthor = inviter.id === member.id;

				if (!isInviteAuthor) {
					if (isFakeInvite)
						inviteData.fake++;
					else if (isRejoinInvite)
						inviteData.rejoin++;
					else inviteData.total++;

					if (index === -1) inviteDb.invites.push(inviteData);
					else inviteDb.invites[index] = inviteData;

					await inviteDb.save();

					const invData = client.invites.getInvite(inviteData);
					description = `This person was invited by **${inviter.displayName}**.`
						+ `\nTotal **${invData.total}** invited (**${invData.rejoin}** rejoins, **${invData.fake}** fakes)`;
				} else description = "Người này dược mời bởi chính bản thân.";
			};

			// update cache invites
			const cachedInv = cachedInvites.get(invite.code);
			if (cachedInv) {
				cachedInv.uses++;
				client.cachedInvites.set(invite.code, cachedInv);
				await updateInvite();
			} else description = "Cannot read invite code information **" + invite.code + "** whose.";
		}
	};

	await handleInvites();

	let serverDb = await serverModel.findOne({});
	if (!serverDb) serverDb = await serverModel.create({});
	// Send log
	serverDb.inviteId.forEach(inviteId => {
		const logInviteChannel = member.guild.channels.cache.get(inviteId);
		const time = parseInt(String(member.user.createdTimestamp / 1000));

		if (logInviteChannel?.isTextBased()) logInviteChannel.send({
			embeds: [{
				author: { name: `${member.user.displayName} | Just joined the server ${member.guild.name}`, icon_url: member.user.displayAvatarURL(), },
				description,
				fields: [{
					name: "Account Age",
					value: `<t:${time}>`
						+ `\n<t:${time}:R>`,
				}],
				timestamp: new Date().toISOString(),
				color: Colors.Blue,
			}]
		});
	});
}