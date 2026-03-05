const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = "!";
let users = {};

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).split(" ");
  const command = args[0];

  if (!users[message.author.id]) {
    users[message.author.id] = { coins: 0 };
  }

  if (command === "hunt") {
    let earn = Math.floor(Math.random() * 50) + 10;
    users[message.author.id].coins += earn;
    message.reply(`🦊 Tumne hunt kiya aur ${earn} coins mile!`);
  }

  if (command === "cash") {
    message.reply(`💰 Tumhare paas ${users[message.author.id].coins} coins hain.`);
  }
});

client.login(process.env.TOKEN);
