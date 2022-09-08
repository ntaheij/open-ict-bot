const { readFile, writeFile } = require("../jsonHelper");

const { guildId, locationOverleg } = require("../../../configs/config.json");

function removeAllPendingChannels() {
  let guild = client.guilds.cache.get(guildId);
  readFile(locationOverleg, "overlegruimtes").then((overlegruimtes) => {
    newOverlegruimtes = [];
    if(overlegruimtes.length < 1) return;
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

module.exports = {
  removeAllPendingChannels,
};
