const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const prefix = "s";

// DATABASE FILE
const dbFile = "./database.json";

// create database if not exist
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({}));
}

let db = JSON.parse(fs.readFileSync(dbFile));

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function getUser(id) {
  if (!db[id]) {
    db[id] = {
      wallet: 0,
      bank: 0,
      gems: 0,
      lastDaily: 0
    };
  }
  return db[id];
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const user = getUser(message.author.id);

  // BALANCE
  if (cmd === "bal") {
    return message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

👤 ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  // DAILY
  if (cmd === "daily") {

    const now = Date.now();
    const cooldown = 86400000;

    if (now - user.lastDaily < cooldown) {
      const timeLeft = cooldown - (now - user.lastDaily);
      const hours = Math.floor(timeLeft / 3600000);
      const minutes = Math.floor((timeLeft % 3600000) / 60000);

      return message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

You already claimed today's reward.

⏱ Next Daily In
${hours}h ${minutes}m

━━━━━━━━━━━━━━━━━━━━━━`
      );
    }

    const reward = 500;

    user.wallet += reward;
    user.lastDaily = now;

    saveDB();

    message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

🎉 Daily Reward Claimed

💰 +${reward} coins added to wallet

━━━━━━━━━━━━━━━━━━━━━━`
    );
  }

  // DEPOSIT
  if (cmd === "deposit") {

    const amount = parseInt(args[0]);

    if (!amount || amount <= 0) return;

    if (user.wallet < amount) {
      return message.reply("Not enough wallet coins.");
    }

    user.wallet -= amount;
    user.bank += amount;

    saveDB();

    message.reply(`Deposited ${amount} coins.`);
  }

  // WITHDRAW
  if (cmd === "withdraw") {

    const amount = parseInt(args[0]);

    if (!amount || amount <= 0) return;

    if (user.bank < amount) {
      return message.reply("Not enough bank coins.");
    }

    user.bank -= amount;
    user.wallet += amount;

    saveDB();

    message.reply(`Withdrawn ${amount} coins.`);
  }

  // GIVE
  if (cmd === "give") {

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target) return;
    if (!amount) return;

    const targetUser = getUser(target.id);

    if (user.wallet < amount) {
      return message.reply("Not enough coins.");
    }

    user.wallet -= amount;
    targetUser.wallet += amount;

    saveDB();

    message.reply(`💸 Sent ${amount} coins to ${target.username}`);
  }

  // COINFLIP
  if (cmd === "cf") {

    const amount = parseInt(args[0]);
    if (!amount) return;

    if (user.wallet < amount) {
      return message.reply("Not enough coins.");
    }

    const win = Math.random() < 0.5;

    if (win) {
      user.wallet += amount;
      message.reply(`🪙 You won ${amount} coins!`);
    } else {
      user.wallet -= amount;
      message.reply(`💀 You lost ${amount} coins.`);
    }

    saveDB();
  }

  // SLOT
  if (cmd === "slot") {

    const amount = parseInt(args[0]);
    if (!amount) return;

    if (user.wallet < amount) {
      return message.reply("Not enough coins.");
    }

    const roll = Math.random();

    if (roll > 0.7) {
      const win = amount * 2;
      user.wallet += win;
      message.reply(`🎰 JACKPOT! You won ${win}`);
    } else {
      user.wallet -= amount;
      message.reply(`🎰 You lost ${amount}`);
    }

    saveDB();
  }

});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
