export const clients = [];

export const broadcastEvent = (type, payload) => {
  clients.forEach(client => {
    client.write(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`);
  });
};
