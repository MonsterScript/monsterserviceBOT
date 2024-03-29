import {
	AutocompleteInteraction,
	ButtonInteraction,
	ChatInputApplicationCommandData,
	ModalSubmitInteraction,
	User,
} from "discord.js";
import { Bot, Context } from "./structures";

export interface InviteCache {
    code: string;
    user: User;
    uses: number;
}

export interface InviteData {
    userId: string;
    rejoin: number;
    fake: number;
    total: number;
}

export declare interface CommandData extends ChatInputApplicationCommandData {
    aliases?: string[];
    command?: {
        slash?: boolean;
        prefix?: boolean;
    };
    whitelist?: CommandWhitelist;
    category?: string;
}

export interface CommandWhitelist {
    developer?: boolean;
    admin?: boolean;
}

export declare interface CommandOptions {
    data: CommandData,
    execute?: (ctx: Context, args: string[]) => void,
    autoComplete?: (interaction: AutocompleteInteraction) => void,
    buttonRun?: (interaction: ButtonInteraction) => void,
    modalRun?: (interaction: ModalSubmitInteraction) => void,
}

export declare interface Event {
    execute?: (client: Bot, ...args: string[]) => void
}