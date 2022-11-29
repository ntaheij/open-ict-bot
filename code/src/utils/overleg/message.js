const { ButtonStyle, ActionRowBuilder, ButtonBuilder } = require("discord.js");

const { readFile } = require("../jsonHelper");

async function updateMessage(guild) {
  let id = "";
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("overleg_create")
      .setLabel("Maak overlegkanaal")
      .setStyle(ButtonStyle.Primary)
  );

  await readFile("configs", "config").then(async (data) => {
    const channel = guild.channels.cache.get(data.overleg.channelId);
    channel.messages.fetch(data.overleg.messageId).then((msg) => {
      msg.delete();
    });

    let sent = await channel.send({
      content: `
Welkom bij de overlegkanalen! Hier kan je een overlegkanaal aanmaken. Dit kanaal is 8 uur geldig, daarna wordt het automatisch weer verwijderd.
Overlegkanalen kan je gebruiken om met je peers te overleggen over een opdracht of om te praten over een bepaald probleem.

**Commando's:**
/overleg start - Maak overlegkanalen aan.
/overleg stop - Verwijder de overleg kanalen.
/overleg toevoegen (@tag) - Voeg een gebruiker toe aan de overleg kanalen.
/overleg verwijderen (@tag) - Verwijder een gebruiker van de overleg kanalen.

*TIP: Om een overleg te starten kan je eventueel ook op de knop hieronder drukken.*
      `,
      components: [row],
    });

    id = sent.id;
  });
  return id;
}

module.exports = {
  updateMessage,
};
