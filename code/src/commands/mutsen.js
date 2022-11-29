const Canvas = require("canvas");
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mutsen')
		.setDescription('Bekijk de mogelijke kerstmutsen'),
	async execute(interaction) {
    const canvas = Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext("2d");
    const hats = await Canvas.loadImage("./assets/hats.png");

    ctx.drawImage(hats, 0, 0, 800, 600);

    const attachment = new AttachmentBuilder(await canvas.toBuffer('image/png'), { name: 'hats.png' });
		await interaction.reply({ content: `Dit zijn de mogelijke mutsen. `, files: [attachment], ephemeral: true });
	},
};
