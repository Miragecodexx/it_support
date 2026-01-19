let io = null;

function setIo(serverIo) {
  io = serverIo;
}

function getIo() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

module.exports = { setIo, getIo };
