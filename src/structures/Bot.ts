import dotenv from "dotenv";
dotenv.config();

import { Client, Collection } from "discord.js";
import { readdirSync } from "fs";

import { Logger } from ".";
import config from "../config.json";
import emojis from "../assets/emojis.json";

import { CommandOptions, Event, InviteCache } from "../types";
import { Utils, Commands, Invites } from "../functions";

export class Bot extends Client {
	public commands: Collection<string, CommandOptions> = new Collection();
	public cachedInvites: Collection<string, InviteCache> = new Collection();
	public logger: Logger = new Logger();

	public dev = process.env.NODE_ENV == "development";
	public readonly emotes = emojis;
	public config = config;

	public utils = new Utils(this);
	public cmds = new Commands(this);
	public invites = new Invites();

	public async start(): Promise<string> {
		this.loadCommands();
		this.loadEvents();
		process.on("uncaughtException", (error) => {
			this.logger.error(error);
		});
		return await this.login(process.env.TOKEN);
	}

	private loadCommands() {
		const categories = readdirSync(`${this.dev ? "./src" : "./dist"}/commands`);
		categories.forEach(category => {
			const commands = readdirSync(`${this.dev ? "./src" : "./dist"}/commands/${category}`);
			commands.forEach(async cmdFile => {
				const cmdName = cmdFile.split(".")[0];
				const cmd: CommandOptions = await import(`../commands/${category}/${cmdName}`);
				cmd.data.category = category;
				this.commands.set(cmd.data.name, cmd);
			});
		});
	}

	private loadEvents() {
		readdirSync(`${this.dev ? "./src" : "./dist"}/events/Bot`).forEach(async event => {
			const eventName = event.split(".")[0];
			const data: Event = await import(`../events/Bot/${eventName}`);
			this.on(eventName, (...p) => data.execute(this, ...p));
		});
	}
}
