const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
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
  schoolChannel,
  guildId,
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

client.login(token);

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(5000, () => {
  console.log("Webserver is running!");
});

setInterval(removeAllPendingChannels, 60 * 1000);

global.client = client;
