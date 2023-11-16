const Canvas = require("canvas");
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mutsen')
		.setDescription('Bekijk de mogelijke kerstmutsen'),
	async execute(interaction) {
		if(new Date('2023-12-26').setHours(23,59,59) <= Date.now()) return interaction.reply({ content: 'Kerst is al voorbij, slimpie.', ephemeral: true });

    const canvas = Canvas.createCanvas(800, 600);
    const ctx = canvas.getContext("2d");
    const hats = await Canvas.loadImage("./assets/hats.png");

    ctx.drawImage(hats, 0, 0, 800, 600);

    const attachment = new AttachmentBuilder(await canvas.toBuffer('image/png'), { name: 'hats.png' });
		await interaction.reply({ content: `Dit zijn de mogelijke mutsen. `, files: [attachment], ephemeral: true });
	},
};
