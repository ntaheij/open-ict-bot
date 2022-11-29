const { removeAllPendingChannels, createChannels, deleteChannels } = require("./channels");
const { updateMessage } = require("./message");

module.exports = {
  removeAllPendingChannels,
  createChannels,
  deleteChannels,
  updateOverlegMessage: updateMessage
};
