import { inviteModel } from "../databases/invite.model";
import { InviteData } from "../types";

export class Invites {
	constructor() { }

	public async findInvite(userId: string, inviteDb?) {
		if (!inviteDb) inviteDb = await inviteModel.findOne();
		if (!inviteDb) inviteDb = await inviteModel.create({});
		if (!inviteDb) inviteDb.invites = [];
		const data: InviteData = inviteDb.invites.find((inv: InviteData) => inv.userId === userId) || { userId, total: 0, fake: 0, rejoin: 0 };
		return data;
	}

	public getInvite(inviteData?: InviteData) {
		const { fake, rejoin, userId } = inviteData;
		const total = inviteData.total - (fake * 2);
		return { userId, total, fake, rejoin };
	}
}