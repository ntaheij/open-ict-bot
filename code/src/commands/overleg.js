const {
  SlashCommandBuilder,
  PermissionsBitField,
  ChannelType,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
} = require("discord.js");

const { guildId, voiceCategory, locationOverleg } = require("../../configs/config.json");

const { readFile, writeFile } = require("../utils/jsonHelper");

async function deleteChannels(interaction, guild, overlegInfo) {
  readFile(locationOverleg, "overlegruimtes").then((data) => {
    let index = data.findIndex((x) => x.textId === overlegInfo.textId);

    if (index > -1) {
      data.splice(index, 1);
      writeFile(locationOverleg, "overlegruimtes", data);
    }
  });

  guild.channels.cache.get(overlegInfo.voiceId).delete();
  guild.channels.cache.get(overlegInfo.textId).delete();
}

async function createChannels(interaction, guild) {
  let name = interaction.member.nickname || interaction.user.username;
  let channelInfo = {
    name: `Overleg ${name}`,
    parent: voiceCategory,
    position: 100,
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
      {
        id: interaction.member.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
    ],
  };

  let overlegInfo = {
    channelName: channelInfo.name,
    channelParent: channelInfo.parent,
    voiceId: null,
    textId: null,
    creationDate: Date.now(),
  };

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("overleg_stop_" + Date.now())
      .setLabel("Stop")
      .setStyle(ButtonStyle.Danger)
  );

  channelInfo.type = ChannelType.GuildVoice;
  await guild.channels.create(channelInfo).then((channel) => {
    overlegInfo.voiceId = channel.id;
  });
  channelInfo.type = ChannelType.GuildText;
  await guild.channels.create(channelInfo).then((channel) => {
    overlegInfo.textId = channel.id;
    channel
      .send({
        content: `<@${interaction.member.id}> Overlegkanaal aangemaakt.\n\n
Gebruik dit kanaal om te overleggen met anderen.\n
Als je klaar bent met overleggen, gebruik dan het commando \`/overleg stop\` om het kanaal te verwijderen.

**Commando's:**
Stop - Verwijder de overleg kanalen.
Toevoegen - Voeg een gebruiker toe aan de overleg kanalen.
Verwijderen - Verwijder een gebruiker van de overleg kanalen.

Dit kanaal wordt automatisch verwijderd na 8 uur.

*TIP: Om het overleg te stoppen kan je eventueel ook op de rode knop hieronder drukken.*
`,
        components: [row],
      })
      .then((message) => {
        const collector = message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 28800000,
        });

        collector.on("collect", (i) => {
          if (i.user.id === interaction.user.id) {
            deleteChannels(interaction, guild, overlegInfo);

            return i.reply({
              content: "Kanalen aan het verwijderen...",
              ephemeral: true,
            });
          } else {
            i.reply({
              content: `Jij mag deze knop niet gebruiken. Alleen <@${interaction.user.id}> mag dat.`,
              ephemeral: true,
            });
          }
        });
      });
  });

  readFile(locationOverleg, "overlegruimtes").then((data) => {
    data.push({ ...overlegInfo });
    writeFile(locationOverleg, "overlegruimtes", data);
  });

  setTimeout(() => {
    deleteChannels(interaction, guild, overlegInfo);
  }, 1000 * 60 * 60 * 8);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("overleg")
    .setDescription("Overlegkanaal acties.")
    .addSubcommand((subcommand) =>
      subcommand.setName("start").setDescription("Start een overleg.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stop")
        .setDescription("Stop het overleggen en verwijder de overlegkanalen.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("toevoegen")
        .setDescription("Voeg een gebruiker toe aan het overleg.")
        .addUserOption((option) =>
          option
            .setName("gebruiker")
            .setDescription("De gebruiker die je wilt toevoegen.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("verwijderen")
        .setDescription("Verwijder een gebruiker van het overleg.")
        .addUserOption((option) =>
          option
            .setName("gebruiker")
            .setDescription("De gebruiker die je wilt verwijderen.")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    let guild = client.guilds.cache.get(guildId);
    let subCommand = interaction.options.getSubcommand();

    switch (subCommand) {
      case "start":
        createChannels(interaction, guild);

        return interaction.reply({
          content: `Kanalen zijn aangemaakt.`,
          ephemeral: true,
        });
      case "stop":
        readFile(locationOverleg, "overlegruimtes").then((overlegruimtes) => {
          overlegruimtes = overlegruimtes.filter(
            (overleg) => overleg.textId === interaction.channel.id
          );
          deleteChannels(interaction, guild, overlegruimtes[0]);
        });
        break;
      case "toevoegen":
        await interaction.channel.permissionOverwrites.edit(
          interaction.options.getUser("gebruiker").id,
          {
            ViewChannel: true,
            Connect: true,
            SendMessages: true,
          }
        );

        await readFile(locationOverleg, "overlegruimtes").then((overlegruimtes) => {
          overlegruimte = overlegruimtes.filter(
            (overleg) => overleg.textId === interaction.channel.id
          );

          let voiceId = overlegruimte[0].voiceId;
          guild.channels.cache.get(voiceId).permissionOverwrites.edit(
            interaction.options.getUser("gebruiker").id,
            {
              ViewChannel: true,
              Connect: true,
              SendMessages: true,
            }
          );
        });

        return interaction.reply({
          content: `Gebruiker toegevoegd.`,
          ephemeral: true,
        });
      case "verwijderen":
        await interaction.channel.permissionOverwrites.delete(
          interaction.options.getUser("gebruiker").id
        );

        await readFile(locationOverleg, "overlegruimtes").then((overlegruimtes) => {
          overlegruimte = overlegruimtes.filter(
            (overleg) => overleg.textId === interaction.channel.id
          );

          let voiceId = overlegruimte[0].voiceId;
					guild.channels.cache.get(voiceId).permissionOverwrites.delete(
            interaction.options.getUser("gebruiker").id
          );
        });

        return interaction.reply({
          content: `Gebruiker verwijderd.`,
          ephemeral: true,
        });
      default:
        break;
    }
  },
};
