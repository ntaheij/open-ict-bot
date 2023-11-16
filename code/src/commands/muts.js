const Canvas = require("canvas");
const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("muts")
    .setDescription("Genereer je kerstmuts!")
    .addMentionableOption((option) =>
      option
        .setName("user")
        .setDescription("De gebruiker die je wilt mutsen")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("muts-id")
        .setDescription("Het id van de muts")
        .setRequired(false)
        .addChoices({ name: "0", value: 0 })
        .addChoices({ name: "1", value: 1 })
        .addChoices({ name: "2", value: 2 })
        .addChoices({ name: "3", value: 3 })
        .addChoices({ name: "4", value: 4 })
    )
    .addIntegerOption((option) =>
      option
        .setName("offset-x")
        .setDescription("De offset van de muts op de x-as")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("offset-y")
        .setDescription("De offset van de muts op de y-as")
        .setRequired(false)
    )
    .addNumberOption((option) =>
      option
        .setName("scale")
        .setDescription("De schaal van de muts")
        .setRequired(false)
    ),
  async execute(interaction) {
    const type = interaction.options.getInteger("muts-id") || 2;
    const user = interaction.options.getMentionable("user") || interaction.user;
    const offsetX =
      interaction.options.getInteger("offset-x") || (1024 - 650) / 2;
    const offsetY = interaction.options.getInteger("offset-y") || 0;
    const scale = interaction.options.getNumber("scale") || 1;
    if (new Date("2023-12-26").setHours(23, 59, 59) <= Date.now())
      return interaction.reply({
        content: "Kerst is al voorbij, slimpie.",
        ephemeral: true,
      });

    const canvas = Canvas.createCanvas(1024, 1024);
    const ctx = canvas.getContext("2d");
    const avatar = await Canvas.loadImage(
      user.displayAvatarURL().replace("webp", "png") + "?size=1024"
    );
    const hat = await Canvas.loadImage("./assets/" + type + ".png");

    ctx.drawImage(avatar, 0, 0, 1024, 1024);
    ctx.drawImage(hat, offsetX, offsetY, 650 * scale, 650 * scale);

    const attachment = new AttachmentBuilder(
      await canvas.toBuffer("image/png"),
      { name: "hat.png" }
    );
    await interaction.reply({
      content: `Hier is je muts, muts! `,
      files: [attachment],
      ephemeral: true,
    });
  },
};
