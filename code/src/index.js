const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const cron = require("node-cron"); 
const app = express();
const {
  Client,
  Collection,
  GatewayIntentBits,
  InteractionType,
} = require("discord.js");
const {
  token,
  reactionChannel,
  guildId,
  eventsChannel,
  announcementsChannel
} = require("../configs/config.json");

const {
  getActualRoleName,
  startUpReactionRoles,
} = require("./utils/reaction-roles");
const {
  removeAllPendingChannels,
  createChannels,
  updateOverlegMessage,
} = require("./utils/overleg");
const {
  updateVraagMessage,
  giveRolesVraagStudent,
} = require("./utils/vraag-de-student");
const { readFile, writeFile } = require("./utils/jsonHelper");

const client = new Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildScheduledEvents,
  ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection
  // With the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
}

client.once("ready", async () => {
  const guild = client.guilds.cache.get(guildId);
  startUpReactionRoles(client);
  const id1 = await updateOverlegMessage(guild);
  const id2 = await updateVraagMessage(guild);

  readFile("configs", "config").then(async (data) => {
    data.overleg.messageId = id1;
    data.vraagStudent.messageId = id2;
    writeFile("configs", "config", data);
  });

  cron.schedule(`0 12 * * FRI`, async function() { 
    checkEvents();
  }); 

  console.log("Ready!");
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.type == InteractionType.MessageComponent) {
    if (interaction.customId == "overleg_create") {
      createChannels(interaction, interaction.guild);
    }
  }

  if (interaction.isSelectMenu()) {
    if (interaction.customId == "select_school") {
      giveRolesVraagStudent(interaction, interaction.guild);
    }
  }

  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error whilst executing this command!",
      ephemeral: true,
    });
  }
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;
  if (!reaction.message.guild) return;

  if (reaction.message.channel.id == reactionChannel) {
    let role = reaction.message.guild.roles.cache.find(
      (r) => getActualRoleName(r.name) === reaction.emoji.name.toLowerCase()
    );
    if (!role) return;

    await reaction.message.guild.members.cache.get(user.id).roles.add(role);
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;
  if (!reaction.message.guild) return;

  if (reaction.message.channel.id == reactionChannel) {
    let role = reaction.message.guild.roles.cache.find(
      (r) => getActualRoleName(r.name) === reaction.emoji.name.toLowerCase()
    );
    if (!role) return;

    await reaction.message.guild.members.cache.get(user.id).roles.remove(role);
  }
});

client.on("guildScheduledEventCreate", async (guildScheduledEvent) => {
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(eventsChannel);
  const url = guildScheduledEvent.url;
  const startTime = guildScheduledEvent.scheduledStartTimestamp;
  const endTime = guildScheduledEvent.scheduledEndTimestamp;
  let description = guildScheduledEvent.description;
  let tags = null;

  let day = new Date(startTime).toLocaleDateString("nl-NL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  let start = new Date(startTime).toLocaleTimeString("nl-NL", { hour: 'numeric', minute: 'numeric' });
  let end = new Date(endTime).toLocaleTimeString("nl-NL", { hour: 'numeric', minute: 'numeric' });

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
**Relevante Tags:** ${getRolesByNames(tags) || "Geen tags gevonden"}

${url}
    `);

  readFile("configs", "events").then(async (data) => {
    data[url] = {
      name: guildScheduledEvent.name,
      messageId: sentMessage.id,
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
});

client.on("guildScheduledEventUpdate", async (old, guildScheduledEvent) => {
  readFile("configs", "events").then(async (data) => {
    const guild = client.guilds.cache.get(guildId);
    const channel = guild.channels.cache.get(eventsChannel);
    const url = guildScheduledEvent.url;
    const startTime = guildScheduledEvent.scheduledStartTimestamp;
    const endTime = guildScheduledEvent.scheduledEndTimestamp;
    let description = guildScheduledEvent.description;
    let tags = null;

    let day = new Date(startTime).toLocaleDateString("nl-NL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let start = new Date(startTime).toLocaleTimeString("nl-NL", { hour: 'numeric', minute: 'numeric' });
    let end = new Date(endTime).toLocaleTimeString("nl-NL", { hour: 'numeric', minute: 'numeric' });

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
**Relevante Tags:** ${getRolesByNames(tags) || "Geen tags gevonden"}
  
${url}
      `);

    data[url] = {
      name: guildScheduledEvent.name,
      messageId: message.id,
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
});

function getRolesByNames(tags) {
  if (!tags) return;
  const guild = client.guilds.cache.get(guildId);
  let rolesToTag = [];
  tags = tags.map((tag) => getActualRoleName(tag.replace("#", "")));

  tags.forEach((tag) => {
    let role = guild.roles.cache.find((r) => getActualRoleName(r.name) === tag);

    if (!role) return;
    rolesToTag.push(`<@&${role.id}>`);
  });

  return rolesToTag.join(" ");
}

function checkEvents() {
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(announcementsChannel);
  
  readFile("configs", "events").then(async (data) => {
    let events = Object.values(data);
    let nextWeek = events.filter((event) => {
      let week = new Date(event.start).getWeekNumber();
      let nextWeekDate = new Date().getWeekNumber()+1;
      return week === nextWeekDate;
    });

    if (nextWeek.length === 0) return;

    let monday = new Date().setToNextWeekDay(1).toLocaleDateString("nl-NL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let friday = new Date().setToNextWeekDay(5).toLocaleDateString("nl-NL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let message = `@everyone\n**Alle evenementen van week ${new Date().getWeekNumber()+1} (${monday} - ${friday}):**\n\n`;
    channel.send(message);

    nextWeek.forEach((event) => {
      let day = new Date(event.start).toLocaleDateString("nl-NL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      let start = new Date(event.start).toLocaleTimeString("nl-NL", { hour: 'numeric', minute: 'numeric' });
      let end = new Date(event.end).toLocaleTimeString("nl-NL", { hour: 'numeric', minute: 'numeric' });

      let date = `${day} van ${start} tot ${end}`;

      message = `**${event.name}**\n${event.description.split(";TAGS;")[0] || ""}\n**Datum:** ${date}\n**Locatie:** ${
        event.location
      }\n\n${event.url}\n\n\n`;
      channel.send(message);
    });
  });
}

Date.prototype.setToNextWeekDay = function(x){
    var day = this.getDay() || 7;
    if( day !== x ) 
      this.setHours(168 + (-24 * (x - 1))); 
    return this;
}

Date.prototype.getWeekNumber = function(){
  var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
  var dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7)
};

client.on("guildScheduledEventDelete", async (guildScheduledEventDelete) => {
  const url = guildScheduledEventDelete.url;
  const guild = client.guilds.cache.get(guildId);
  const channel = guild.channels.cache.get(eventsChannel);

  readFile("configs", "events").then(async (data) => {
    const message = await channel.messages.fetch(data[url].messageId);
    message.delete();
    delete data[url];
    writeFile("configs", "events", data);
  });
});

client.login(token);

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(5000, () => {
  console.log("Webserver is running!");
});

setInterval(removeAllPendingChannels, 60 * 1000);

global.client = client;
