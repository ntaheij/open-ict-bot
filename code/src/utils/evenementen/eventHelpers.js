const { getActualRoleName } = require("../reaction-roles/filters");

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

function getRolesByNames(guildId, tags) {
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

module.exports = {
  getRolesByNames,
  Date
};
