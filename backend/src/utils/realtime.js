const clients = new Map();

export const addRealtimeClient = (userId, res) => {
  const key = userId.toString();
  const userClients = clients.get(key) || new Set();
  userClients.add(res);
  clients.set(key, userClients);

  return () => {
    userClients.delete(res);
    if (userClients.size === 0) {
      clients.delete(key);
    }
  };
};

export const sendRealtimeEvent = (userId, event, payload = {}) => {
  const userClients = clients.get(userId.toString());
  if (!userClients) return;

  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  userClients.forEach((res) => res.write(message));
};
