import { GuildMember } from "discord.js";
import { Bot } from "../../structures";
import { inviteModel } from "../../databases/invite.model";

export async function execute(client: Bot, member: GuildMember) {
	let db = await inviteModel.findOne();
	if (!db) db = await inviteModel.create({});
	if (!db.joined) db.joined = [];
	if (!db.joined.includes(member.id)) db.joined.push(member.id);
	await db.save();
}