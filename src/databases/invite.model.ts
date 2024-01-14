import { Schema, model } from "mongoose";
const schema = new Schema({
	invites: [{
		userId: String,
		total: Number,
		fake: Number,
		rejoin: Number,
	}],
	// Check rejoin
	joined: [String],
}, { id: false });
export const inviteModel = model("invites", schema);