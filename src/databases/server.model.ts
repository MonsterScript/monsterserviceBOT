import { Schema, model } from "mongoose";
const schema = new Schema({
	// Log channel id
	feedbackId: [String],
	redeemId: [String],
	stockId: [String],
	inviteId: [String],
}, { id: false });
export const serverModel = model("servers", schema);