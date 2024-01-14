import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { Bot } from "../../structures";

export async function execute(client: Bot) {
	client.logger.start(`Logged in as ${client.user.tag}`);

	client.application.commands.set(client.commands.map(cmd => cmd.data).filter(cmd => !cmd.command?.prefix));

	client.guilds.cache.each(async guild => {
		await guild.invites.fetch();
		guild.invites.cache.each(invite => {
			client.cachedInvites.set(invite.code, {
				user: invite.inviter,
				uses: invite.uses,
				code: invite.code,
			});
		});
	});

	await mongoose.connect(process.env.MONGO_STRING).then(() => {
		client.logger.start("Connected to MongoDB!");
	});
}