const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefixList = ["s", "S", "spark", "Spark"];
const DAILY_COOLDOWN = 86400000; // 24 hours

let db = JSON.parse(fs.readFileSync("./index.json", "utf8"));

function saveDB() {
  fs.writeFileSync("./index.json", JSON.stringify(db, null, 2));
}

function getUser(id) {
  if (!db.users[id]) {
    db.users[id] = {
      wallet: 0,
      bank: 0,
      gems: 0,
      lastDaily: 0
    };
  }
  return db.users[id];
}

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  let prefixUsed = prefixList.find(p =>
    message.content.toLowerCase().startsWith(p.toLowerCase())
  );

  if (!prefixUsed) return;

  const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const user = getUser(message.author.id);

  // BALANCE
  if (cmd === "bal") {

    message.reply(`
━━━━━━━━━━━━━━━━━━━━━━

👤 ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  // DAILY
  if (cmd === "daily") {

    let now = Date.now();

    if (now - user.lastDaily < DAILY_COOLDOWN) {

      let remaining = DAILY_COOLDOWN - (now - user.lastDaily);

      let hours = Math.floor(remaining / 3600000);
      let minutes = Math.floor((remaining % 3600000) / 60000);
      let seconds = Math.floor((remaining % 60000) / 1000);

      return message.reply(`
━━━━━━━━━━━━━━━━━━━━━━

You already claimed today's reward.

⏱ Next Daily In
${hours}h ${minutes}m ${seconds}s

━━━━━━━━━━━━━━━━━━━━━━
`);
    }

    user.wallet += 1000;
    user.lastDaily = now;
    saveDB();

    message.reply(`
━━━━━━━━━━━━━━━━━━━━━━

🎁 Daily Reward Claimed

+1000 Coins added to wallet

⏱ Come back again in 24h

━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  // GIVE
  if (cmd === "give") {

    let target = message.mentions.users.first();
    let amount = parseInt(args[1]);

    if (!target || isNaN(amount)) return;

    if (user.wallet < amount) return message.reply("Not enough coins.");

    const targetUser = getUser(target.id);

    user.wallet -= amount;
    targetUser.wallet += amount;

    saveDB();

    message.reply(`
━━━━━━━━━━━━━━━━━━━━━━

💸 Coins Sent

Sender : ${message.author.username}
Receiver : ${target.username}

Amount : ${amount}

━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  // DEPOSIT
  if (cmd === "deposit") {

    let amount = parseInt(args[0]);
    if (isNaN(amount)) return;

    if (user.wallet < amount) return message.reply("Not enough coins.");

    user.wallet -= amount;
    user.bank += amount;

    saveDB();

    message.reply(`
━━━━━━━━━━━━━━━━━━━━━━

🏦 Bank Deposit

Amount : ${amount}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  // WITHDRAW
  if (cmd === "withdraw") {

    let amount = parseInt(args[0]);
    if (isNaN(amount)) return;

    if (user.bank < amount) return message.reply("Not enough coins.");

    user.bank -= amount;
    user.wallet += amount;

    saveDB();

    message.reply(`
━━━━━━━━━━━━━━━━━━━━━━

🏧 Bank Withdraw

Amount : ${amount}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━
`);
  }

});

client.login("YOUR_BOT_TOKEN");
