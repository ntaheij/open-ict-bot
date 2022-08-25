function getActualRoleName(role) {
  role = role.toLowerCase();
  role = role.replace(/\+/g, "plus");
  role = role.replace(/\#/g, "sharp");
  role = role.replace(/ gilde/g, "");
  role = role.replace(/ \([^()]*\)/g, "");
  role = role.replace(/activiteiten/g, "ac");
  role = role.replace(/ /g, "_");
  
  if (role.length === 1) role += "_";

  return role;
}

module.exports = {
  getActualRoleName,
};
