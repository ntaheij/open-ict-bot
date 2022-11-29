async function giveRoles(interaction, guild) {
  const interactionUser = await interaction.guild.members.fetch(
    interaction.user.id
  );
  let role = guild.roles.cache.find(
    (r) => r.name.toLowerCase() === interaction.values[0].toLowerCase()
  );
  let allrole = guild.roles.cache.find((r) => r.name === "Vraag de Student");
  if (role) {
    interactionUser.roles.add(role).catch(() => {
      interaction.reply({
        content:
          'De rol "' +
          interaction.values[0] +
          '" rol bestaat niet. Stuur een bericht naar de Moderators.',
        ephemeral: true,
      });
    });
    interactionUser.roles.add(allrole);
    interaction.reply({
      content:
        "Je hebt de rol " +
        role.name +
        " (Vraag de Student) gekregen. Je hebt nu extra kanalen die je kan bekijken.",
      ephemeral: true,
    });
  } else {
    interaction.reply({
      content:
        'De rol "' +
        interaction.values[0] +
        '" rol bestaat niet. Stuur een bericht naar de Moderators.',
      ephemeral: true,
    });
  }
}

module.exports = {
  giveRoles,
};
