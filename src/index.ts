import { ActivityType, GatewayIntentBits, Partials } from "discord.js";
import { Bot } from "./structures";

const bot = new Bot({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildInvites,
	],
	presence: {
		status: "online",
		activities: [{ type: ActivityType.Watching, name: "" }]
	},
	partials: [Partials.Channel, Partials.Message, Partials.GuildMember, Partials.User],
});

bot.start();