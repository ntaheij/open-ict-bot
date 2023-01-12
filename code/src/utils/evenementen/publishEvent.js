const { readFile, writeFile } = require("../../utils/jsonHelper");
const { getRolesByNames, Date } = require("./eventHelpers");
const { guildId, eventsChannel, announcementsChannel } = require("../../../configs/config.json");

async function createEvent(guildScheduledEvent) {
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(eventsChannel);
  const url = guildScheduledEvent.url;
  const startTime = guildScheduledEvent.scheduledStartTimestamp;
  const endTime = guildScheduledEvent.scheduledEndTimestamp;
  let description = guildScheduledEvent.description;
  let tags = null;

  let day = new Date(startTime).toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  let start = new Date(startTime).toLocaleTimeString("nl-NL", {
    hour: "numeric",
    minute: "numeric",
  });
  let end = new Date(endTime).toLocaleTimeString("nl-NL", {
    hour: "numeric",
    minute: "numeric",
  });

  let date = `${day} van ${start} tot ${end}`;

  if (description != null && description.includes(";TAGS;")) {
    let tmp = description.split(";TAGS; ");
    description = tmp[0];
    tags = tmp[1].split(" ");
    tags = tags.map((tag) => tag.replace("#", ""));
  }
  sentMessage = await channel.send(`
**${guildScheduledEvent.name}**
${description || ""}

**Datum:** ${date}
**Locatie:** ${
    guildScheduledEvent.channelId
      ? `<#${guildScheduledEvent.channelId}>`
      : guildScheduledEvent.entityMetadata.location
  }
**Relevante Tags:** ${getRolesByNames(guildId, tags) || "Geen tags gevonden"}

${url}
    `);

  readFile("configs", "events").then(async (data) => {
    data[url] = {
      name: guildScheduledEvent.name,
      messageId: sentMessage.id,
      announcementMessageId: null,
      description: guildScheduledEvent.description,
      start: guildScheduledEvent.scheduledStartTimestamp,
      end: guildScheduledEvent.scheduledEndTimestamp,
      location: guildScheduledEvent.channelId
        ? `<#${guildScheduledEvent.channelId}>`
        : guildScheduledEvent.entityMetadata.location,
      url: url,
      tags: tags,
    };

    writeFile("configs", "events", data);
  });
}

async function updateEvent(guildScheduledEvent) {
  readFile("configs", "events").then(async (data) => {
    const guild = client.guilds.cache.get(guildId);
    const channel = guild.channels.cache.get(eventsChannel);
    const url = guildScheduledEvent.url;
    const startTime = guildScheduledEvent.scheduledStartTimestamp;
    const endTime = guildScheduledEvent.scheduledEndTimestamp;
    let description = guildScheduledEvent.description;
    let tags = null;

    let day = new Date(startTime).toLocaleDateString("nl-NL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    let start = new Date(startTime).toLocaleTimeString("nl-NL", {
      timezone: "Europe/Amsterdam",
      hour: "numeric",
      minute: "numeric",
    });
    let end = new Date(endTime).toLocaleTimeString("nl-NL", {
      timezone: "Europe/Amsterdam",
      hour: "numeric",
      minute: "numeric",
    });

    let date = `${day} van ${start} tot ${end}`;

    if (description != null && description.includes(";TAGS;")) {
      let tmp = description.split(";TAGS; ");
      description = tmp[0];
      tags = tmp[1].split(" ");
      tags = tags.map((tag) => tag.replace("#", ""));
    }
    const message = await channel.messages.fetch(data[url].messageId);
    message.edit(`
**${guildScheduledEvent.name}**
${description || ""}

**Datum:** ${date}
**Locatie:** ${
      guildScheduledEvent.channelId
        ? `<#${guildScheduledEvent.channelId}>`
        : guildScheduledEvent.entityMetadata.location
    }
**Relevante Tags:** ${getRolesByNames(guildId, tags) || "Geen tags gevonden"}
  
${url}
      `);

    data[url] = {
      name: guildScheduledEvent.name,
      messageId: message.id,
      announcementMessageId: data[url].announcementMessageId || null,
      description: guildScheduledEvent.description,
      start: startTime,
      end: endTime,
      location: guildScheduledEvent.channelId
        ? `<#${guildScheduledEvent.channelId}>`
        : guildScheduledEvent.entityMetadata.location,
      url: url,
      tags: tags,
    };

    writeFile("configs", "events", data);
  });
}

async function deleteEvent(guildScheduledEvent) {
  const url = guildScheduledEvent.url;
  const guild = client.guilds.cache.get(guildId);
  const eChannel = guild.channels.cache.get(eventsChannel);
  const aChannel = guild.channels.cache.get(announcementsChannel);

  readFile("configs", "events").then(async (data) => {
    const messageEventsChannel = await eChannel.messages.fetch(data[url].messageId);
    const messageAnnouncementsChannel = await aChannel.messages.fetch(data[url].announcementMessageId);
    messageEventsChannel.delete();
    messageAnnouncementsChannel.delete();
    delete data[url];
    writeFile("configs", "events", data);
  });
}

module.exports = {
  createEvent,
  updateEvent,
  deleteEvent,
};
