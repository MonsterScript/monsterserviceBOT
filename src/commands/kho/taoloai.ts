import { CommandData } from "../../types";
import { Context } from "../../structures";
import { ApplicationCommandOptionType } from "discord.js";
import { stockModel } from "../../databases/stock.model";

export const data: CommandData = {
    name: "taoloai",
    description: "tạo loại hàng",
    options: [{
        name: "name",
        description: "tên loại hàng",
        type: ApplicationCommandOptionType.String,
        required: true,
    }],
    command: { slash: true },
    whitelist: { admin: true },
};

export async function execute(ctx: Context) {
    const name = ctx.interaction.options.getString("name");

    await ctx.sendDeferMessage(false);

    let db = await stockModel.findOne();
    if (!db) db = await stockModel.create({});
    if (!db.productType) db.productType = [];

    const stock = db.productType.find(n => name === n);
    if (stock)
        return ctx.sendFollowUp("Tên loại hàng này đã tồn tại!");

    db.productType.push(name);
    await db.save();

    ctx.sendFollowUp(`Đã tạo loại hàng **${name}**!`);
}
