const { ActionRowBuilder, SelectMenuBuilder } = require("discord.js");

const { readFile } = require("../jsonHelper");

async function updateMessage(guild) {
  let id = "";
  await readFile("configs", "config").then(async (data) => {
    const scholen = data.vraagStudent.scholen;
    const row = new ActionRowBuilder().addComponents(
      new SelectMenuBuilder()
        .setCustomId("select_school")
        .setPlaceholder("Nothing selected")
        .addOptions(
          scholen.map((school) => {
            return { label: school, description: school, value: school };
          })
        )
    );

    const channel = guild.channels.cache.get(data.vraagStudent.channelId);
    channel.messages.fetch(data.vraagStudent.messageId).then((msg) => {
      msg.delete();
    });

    let sent = await channel.send({
      content: `
        Kies hieronder de school waar je op zit.
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
