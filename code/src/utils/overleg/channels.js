const {
  PermissionsBitField,
  ChannelType,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
} = require("discord.js");

const { readFile, writeFile } = require("../jsonHelper");

const {
  guildId,
  locationOverleg,
  voiceCategory,
} = require("../../../configs/config.json");

function removeAllPendingChannels() {
  let guild = client.guilds.cache.get(guildId);
  readFile(locationOverleg, "overlegruimtes").then((overlegruimtes) => {
    newOverlegruimtes = [];
    if (overlegruimtes.length < 1) return;
    for (i = 0; i < overlegruimtes.length; i++) {
      const overlegruimte = overlegruimtes[i];

      let textId = overlegruimte.textId;
      let voiceId = overlegruimte.voiceId;

      if (overlegruimte.creationDate < Date.now() - 28800000) {
        guild.channels.cache.get(textId).delete();
        guild.channels.cache.get(voiceId).delete();

        newOverlegruimtes = overlegruimtes.splice(i, 1);
      }
    }
    writeFile(locationOverleg, "overlegruimtes", overlegruimtes);
  });
}

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
  overlegruimtes = await readFile(locationOverleg, "overlegruimtes");
  if (overlegruimtes.length > 0) {
    overlegruimtes = overlegruimtes.filter(
      (overleg) => overleg.creationUser === interaction.user.id
    );
    if (overlegruimtes.length > 0) {
      return interaction.reply({
        content: `Je hebt al een overlegkanaal aangemaakt.`,
        ephemeral: true,
      });
    }
  }

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
    creationUser: interaction.member.id,
  };

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("overleg_stop_" + Date.now())
      .setLabel("Stop overleg")
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

    return interaction.reply({
      content: `Kanalen zijn aangemaakt.`,
      ephemeral: true,
    });
  });

  readFile(locationOverleg, "overlegruimtes").then((data) => {
    data.push({ ...overlegInfo });
    writeFile(locationOverleg, "overlegruimtes", data);
  });

  setTimeout(() => {
    removeAllPendingChannels();
  }, 1000 * 60 * 60 * 8);
}

module.exports = {
  removeAllPendingChannels,
  deleteChannels,
  createChannels,
};
