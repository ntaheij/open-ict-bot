const { SlashCommandBuilder } = require("discord.js");

const { guildId, locationOverleg } = require("../../configs/config.json");

const { readFile, writeFile } = require("../utils/jsonHelper");
const { createChannels, deleteChannels } = require("../utils/overleg");

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
        break;
      case "stop":
        readFile(locationOverleg, "overlegruimtes").then((overlegruimtes) => {
          if(overlegruimtes.length <= 0 ) {
            return interaction.reply({
              content: `Dit is geen overlegkanaal.`,
              ephemeral: true,
            });
          }
          overlegruimtes = overlegruimtes.filter(
            (overleg) => overleg.textId === interaction.channel.id
          );

          if(overlegruimtes.length <= 0 ) {
            return interaction.reply({
              content: `Dit is geen overlegkanaal.`,
              ephemeral: true,
            });
          }

          if (interaction.user.id === overlegruimtes[0].creationUser) {
            interaction.reply({
              content: "Kanalen aan het verwijderen...",
              ephemeral: true,
            });
          } else {
            return interaction.reply({
              content: `Jij mag deze knop niet gebruiken. Alleen <@${overlegruimtes[0].creationUser}> mag dat.`,
              ephemeral: true,
            });
          }

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

        await readFile(locationOverleg, "overlegruimtes").then(
          (overlegruimtes) => {
            overlegruimte = overlegruimtes.filter(
              (overleg) => overleg.textId === interaction.channel.id
            );

            let voiceId = overlegruimte[0].voiceId;
            guild.channels.cache
              .get(voiceId)
              .permissionOverwrites.edit(
                interaction.options.getUser("gebruiker").id,
                {
                  ViewChannel: true,
                  Connect: true,
                  SendMessages: true,
                }
              );
          }
        );

        return interaction.reply({
          content: `<@${interaction.options.getUser("gebruiker").id}> toegevoegd.`,
        });
      case "verwijderen":
        await interaction.channel.permissionOverwrites.delete(
          interaction.options.getUser("gebruiker").id
        );

        await readFile(locationOverleg, "overlegruimtes").then(
          (overlegruimtes) => {
            overlegruimte = overlegruimtes.filter(
              (overleg) => overleg.textId === interaction.channel.id
            );

            let voiceId = overlegruimtes[0].voiceId;
            guild.channels.cache
              .get(voiceId)
              .permissionOverwrites.delete(
                interaction.options.getUser("gebruiker").id
              );
          }
        );

        return interaction.reply({
          content: `<@${interaction.options.getUser("gebruiker").id}> verwijderd.`,
        });
      default:
        break;
    }
  },
};
