const { guildId, reactionChannel } = require("../../../configs/config.json");
const { emojis } = require("../../../configs/place-emojis.json");

function startUpReactionRoles(client) {
  console.log("Start-up reaction roles");
  let guild = client.guilds.cache.get(guildId);
  let channel = guild.channels.cache.get(reactionChannel);
  channel.messages.fetch({ limit: 100 }).then((messages) => {
    console.log(
      messages.size + " messages found in " + channel.name + " channel."
    );

    for (messageId in emojis) {
      let finalEmojis = emojis[messageId];
      let message = messages.find((m) => m.id == messageId);
      for (emoji in finalEmojis) {
        if (message) {
          message.react(finalEmojis[emoji]);
        }
      }
    }
  });
}

module.exports = {

  startUpReactionRoles,
};


