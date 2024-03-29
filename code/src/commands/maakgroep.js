const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("maakgroep")
    .setDescription("Maak een projectgroep aan.")
    .addStringOption((option) =>
      option
        .setName("naam")
        .setDescription("Naam van de groep")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("jaarlaag")
        .setDescription("Jaarlaag van de groep")
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let groupName = interaction.options.getString("naam");
    const guild = interaction.guild;
    const position = await guild.roles.cache.find(
      (role) => role.name == `Open Inno`
    ).position;
    const role = await guild.roles.create({
      name: groupName,
      color: "#99aab5",
      mentionable: true,
      position: position,
      permissions: [
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.SendMessagesInThreads,
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.CreatePrivateThreads,
        PermissionsBitField.Flags.ChangeNickname,
      ],
      reason: `Projectgroep ${groupName}`,
    });
    const yearRole = await guild.roles.cache.find(
      (role) =>
        role.name == `Jaar ${interaction.options.getInteger("jaarlaag")}`
    );

    const category = await guild.channels.create({
      name: groupName.toUpperCase(),
      type: ChannelType.GuildCategory,
      reason: `Projectgroep ${groupName}`,
      permissionOverwrites: [
        {
          id: role.id,
          allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.SendMessagesInThreads,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.CreatePrivateThreads,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.Connect,
          ],
        },
        {
          id: guild.roles.everyone.id,
          deny: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
          ],
        },
      ],
    });

    const textChannel = await guild.channels.create({
      name: groupName.toLowerCase(),
      type: ChannelType.GuildText,
      reason: `Projectgroep ${groupName}`,
      parent: category.id,
    });
    groupName = groupName.replace(/[^\w\s]/gi, "");
    groupName = groupName.replace(/\s/g, "-");
    const voiceChannel = await guild.channels.create({
      name: groupName.toLowerCase(),
      type: ChannelType.GuildVoice,
      reason: `Projectgroep ${groupName}`,
      parent: category.id,
      permissionOverwrites: [
        {
          id: role.id,
          allow: [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.SendMessagesInThreads,
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.CreatePrivateThreads,
            PermissionsBitField.Flags.ManageChannels,
            PermissionsBitField.Flags.ManageMessages,
            PermissionsBitField.Flags.Connect,
          ],
        },
        {
          id: yearRole.id,
          allow: [
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ViewChannel,
          ],
        },
        {
          id: guild.roles.everyone.id,
          deny: [
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.ViewChannel,
          ],
        },
      ],
    });
    interaction.editReply({
      content: `Projectgroep ${groupName} is aangemaakt.`,
      ephemeral: true,
    });
  },
};
