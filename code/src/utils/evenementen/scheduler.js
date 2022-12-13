const { readFile, writeFile } = require("../../utils/jsonHelper");
const { Date } = require("./eventHelpers");
const {
  guildId,
  announcementsChannel,
} = require("../../../configs/config.json");
function checkEvents() {
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(announcementsChannel);

  readFile("configs", "events").then(async (data) => {
    let events = Object.values(data);
    let nextWeek = events.filter((event) => {
      let week = new Date(event.start).getWeekNumber();
      let nextWeekDate = new Date().getWeekNumber() + 1;
      return week === nextWeekDate;
    });

    if (nextWeek.length === 0) return;

    let monday = new Date().setToNextWeekDay(1).toLocaleDateString("nl-NL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    let friday = new Date().setToNextWeekDay(5).toLocaleDateString("nl-NL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let message = `@everyone\n**Alle evenementen van week ${
      new Date().getWeekNumber() + 1
    } (${monday} - ${friday}):**\n\n`;
    // channel.send(message);

    new Promise((resolve, reject) => {
      nextWeek.forEach(async (event, index, array) => {
        let description = event.description;
        if (description != null && description.includes(";TAGS;")) {
          let tmp = description.split(";TAGS; ");
          description = tmp[0];
          tags = tmp[1].split(" ");
          tags = tags.map((tag) => tag.replace("#", ""));
        }

        let day = new Date(event.start).toLocaleDateString("nl-NL", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        let start = new Date(event.start).toLocaleTimeString("nl-NL", {
          hour: "numeric",
          minute: "numeric",
        });
        let end = new Date(event.end).toLocaleTimeString("nl-NL", {
          hour: "numeric",
          minute: "numeric",
        });

        let date = `${day} van ${start} tot ${end}`;

        message = `**${event.name}**\n${
          description || ""
        }\n**Datum:** ${date}\n**Locatie:** ${event.location}\n\n${
          event.url
        }\n\n\n`;
        let sentMessage = await channel.send(message);
        data[event.url].announcementMessageId = sentMessage.id;
        if (index === array.length -1) resolve();
      });
    }).then(() => {
      writeFile("configs", "events", data);
    });
  });
}

module.exports = {
  checkEvents,
};
