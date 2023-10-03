const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lock')
		.setDescription('Lock a channel temporarily.')
		.addChannelOption(option => option.setName('channel').setDescription('Enter a channel (Default: current)').setRequired(false)),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel') || interaction.channel;
		// if(!channel.isText()) return interaction.reply({ content: '💢 This command only works in text channels!', ephemeral: true });
		if (!interaction.member.permissions.has('MANAGE_CHANNELS')) return interaction.reply({ content: '❌ You do not have the required permissions to use this command!', ephemeral: true });
		await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
		await interaction.reply({ content: `🔒 Locked ${channel}!`, ephemeral: true });
	},
};
