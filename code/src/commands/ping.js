const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.addStringOption(option => option.setName('input').setDescription('Enter a string').setRequired(false)),
	async execute(interaction) {
		const string = interaction.options.getString('input');
		await interaction.reply({ content: `Pong! ${string ? string : ""}`, ephemeral: true });
	},
};
