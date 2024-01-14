import { Schema, model } from "mongoose";
const schema = new Schema({
	stock: [{
		name: String,
		content: [String],
		loai: String,
	}],
	codeList: [{
		code: String,
		amount: Number,
		name: String,
		active: Boolean,
	}],
	inviteReward: [{
		inviteAmount: Number,
		name: String,
		amount: Number,
		id: Number,
	}],
	productType: [String],
	// Claimed
	rewardList: [{
		userId: String,
		rewardId: Number,
	}],
	rewardId: Number,
}, { id: false });
export const stockModel = model("stock", schema);