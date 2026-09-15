const fs = require('fs');
const path = require('path');
const { REST, Routes, Collection } = require('discord.js');
const config = require('../../config');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '../commands');
  
  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    return [];
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  const commandsData = [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    try {
      delete require.cache[require.resolve(filePath)];
      const command = require(filePath);
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
        commandsData.push(command.data.toJSON());
        console.log(`Załadowano komendę: /${command.data.name}`);
      }
    } catch (err) {
      console.error(`Błąd ładowania komendy ${file}:`, err);
    }
  }

  return commandsData;
}

async function registerGuildSlashCommands(client, commandsData, guildId) {
  if (!config.token) return;
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    await rest.put(Routes.applicationCommands(config.clientId), { body: [] }).catch(() => {});
    const data = await rest.put(
      Routes.applicationGuildCommands(config.clientId, guildId),
      { body: commandsData }
    );
    console.log(`Zarejestrowano ${data.length} komend dla serwera ${guildId}`);
  } catch (error) {
    console.error(`Błąd rejestracji komend (${guildId}):`, error.message);
  }
}

async function registerSlashCommands(client, commandsData) {
  for (const guild of client.guilds.cache.values()) {
    await registerGuildSlashCommands(client, commandsData, guild.id);
  }
}

module.exports = {
  loadCommands,
  registerSlashCommands,
  registerGuildSlashCommands
};
