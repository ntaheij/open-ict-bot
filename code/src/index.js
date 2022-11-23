const fs = require("node:fs");
const path = require("node:path");
const express = require('express')
const app = express()
const { Client, Collection, GatewayIntentBits, ButtonStyle, ButtonBuilder, ActionRowBuilder, InteractionType } = require("discord.js");
const { token, reactionChannel, schoolChannel, guildId } = require("../configs/config.json");

const { getActualRoleName, startUpReactionRoles } = require("./utils/reaction-roles");
const { removeAllPendingChannels, createChannels } = require("./utils/overleg");
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

client.once("ready", () => {
  const guild = client.guilds.cache.get(guildId);
  startUpReactionRoles(client);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
    .setCustomId("overleg_create")
    .setLabel("Maak overlegkanaal")
    .setStyle(ButtonStyle.Primary)
    );
    
    readFile("configs", "config").then(async (data) => {
      const channel = guild.channels.cache.get(data.overleg.channelId);
      channel.messages.fetch(data.overleg.messageId).then((msg) => {
        msg.delete();
      });

      let sent = await channel.send({ content: `
Welkom bij de overlegkanalen! Hier kan je een overlegkanaal aanmaken. Dit kanaal is 8 uur geldig, daarna wordt het automatisch weer verwijderd.
Overlegkanalen kan je gebruiken om met je peers te overleggen over een opdracht of om te praten over een bepaald probleem.

**Commando's:**
/overleg start - Maak overlegkanalen aan.
/overleg stop - Verwijder de overleg kanalen.
/overleg toevoegen (@tag) - Voeg een gebruiker toe aan de overleg kanalen.
/overleg verwijderen (@tag) - Verwijder een gebruiker van de overleg kanalen.

*TIP: Om een overleg te starten kan je eventueel ook op de knop hieronder drukken.*
      `, components: [row] });
      data.overleg.messageId = sent.id;

      writeFile("configs", "config", data);
  });

  console.log("Ready!");
});

client.on("messageCreate", async (message) => {
  if(message.channel.id === schoolChannel) {
    let role = message.guild.roles.cache.find((r) => r.name.toLowerCase() === message.content.toLowerCase());
    let allrole = message.guild.roles.cache.find((r) => r.name === "Vraag de Student");
    if(role) {
      message.member.roles.add(role);
      message.member.roles.add(allrole);
      message.react("✅");
    } else {
      message.react("❌");
    }

    message.delete({timeout: "10000"})
  }
}); 

client.on("interactionCreate", async (interaction) => {
  if(interaction.type == InteractionType.MessageComponent) {
    if(interaction.customId == 'overleg_create') {
      createChannels(interaction, interaction.guild);
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
    let role = reaction.message.guild.roles.cache.find((r) => getActualRoleName(r.name) === reaction.emoji.name.toLowerCase());
    if(!role) return;

    await reaction.message.guild.members.cache.get(user.id).roles.add(role);
  }
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.partial) await reaction.message.fetch();
  if (reaction.partial) await reaction.fetch();
  if (user.bot) return;
  if (!reaction.message.guild) return;

  if (reaction.message.channel.id == reactionChannel) {
    let role = reaction.message.guild.roles.cache.find((r) => getActualRoleName(r.name) === reaction.emoji.name.toLowerCase());
    if(!role) return;

    await reaction.message.guild.members.cache.get(user.id).roles.remove(role);
  }
});

client.login(token);

app.get('/', (req, res) => {
  res.send('Bot is running!');
})

app.listen(5000, () => {
  console.log('Webserver is running!');
})

setInterval(removeAllPendingChannels, 60*1000);

global.client = client;