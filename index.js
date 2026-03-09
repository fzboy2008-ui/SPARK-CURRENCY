const { Client, GatewayIntentBits } = require("discord.js"); const fs = require("fs");

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });

const prefixList = ["s", "S", "spark", "Spark"]; const DAILY_COOLDOWN = 86400000; // 24h

let db = JSON.parse(fs.readFileSync("./index.json", "utf8"));

function saveDB() { fs.writeFileSync("./index.json", JSON.stringify(db, null, 2)); }

function getUser(id) { if (!db.users[id]) { db.users[id] = { wallet: 0, bank: 0, gems: 0, lastDaily: 0 }; } return db.users[id]; }

client.on("messageCreate", async (message) => { if (message.author.bot) return;

let prefixUsed = prefixList.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()) );

if (!prefixUsed) return;

const args = message.content.slice(prefixUsed.length).trim().split(/ +/); const cmd = args.shift().toLowerCase();

const user = getUser(message.author.id);

// BALANCE if (cmd === "bal") { message.reply(\n━━━━━━━━━━━━━━━━━━━━━━\n\n👤 ${message.author.username}\n\n💵 Wallet : ${user.wallet}\n🏦 Bank   : ${user.bank}\n💎 Gems   : ${user.gems}\n\n━━━━━━━━━━━━━━━━━━━━━━\n); }

// DAILY if (cmd === "daily") { let now = Date.now();

if (now - user.lastDaily < DAILY_COOLDOWN) {
  let remaining = DAILY_COOLDOWN - (now - user.lastDaily);

  let hours = Math.floor(remaining / 3600000);
  let minutes = Math.floor((remaining % 3600000) / 60000);
  let seconds = Math.floor((remaining % 60000) / 1000);

  return message.reply(`\n━━━━━━━━━━━━━━━━━━━━━━\n\nYou already claimed today's reward.\n\n⏱ Next Daily In\n${hours}h ${minutes}m ${seconds}s\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);
}

user.wallet += 1000;
user.lastDaily = now;

saveDB();

message.reply(`\n━━━━━━━━━━━━━━━━━━━━━━\n\n🎁 Daily Reward Claimed\n\n+1000 Coins added to wallet\n\n⏱ Come back again in 24h\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);

}

// GIVE if (cmd === "give") { let target = message.mentions.users.first(); let amount = parseInt(args[1]);

if (!target || isNaN(amount)) return;

if (user.wallet < amount) return message.reply("Not enough coins.");

const targetUser = getUser(target.id);

user.wallet -= amount;
targetUser.wallet += amount;

saveDB();

message.reply(`\n━━━━━━━━━━━━━━━━━━━━━━\n\n💸 Coins Sent\n\nSender : ${message.author.username}\nReceiver : ${target.username}\n\nAmount : ${amount}\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);

}

// DEPOSIT if (cmd === "deposit") { let amount = parseInt(args[0]); if (isNaN(amount)) return;

if (user.wallet < amount) return message.reply("Not enough coins.");

user.wallet -= amount;
user.bank += amount;

saveDB();

message.reply(`\n━━━━━━━━━━━━━━━━━━━━━━\n\n🏦 Bank Deposit\n\nAmount : ${amount}\n\n💵 Wallet : ${user.wallet}\n🏦 Bank   : ${user.bank}\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);

}

// WITHDRAW if (cmd === "withdraw") { let amount = parseInt(args[0]); if (isNaN(amount)) return;

if (user.bank < amount) return message.reply("Not enough coins.");

user.bank -= amount;
user.wallet += amount;

saveDB();

message.reply(`\n━━━━━━━━━━━━━━━━━━━━━━\n\n🏧 Bank Withdraw\n\nAmount : ${amount}\n\n💵 Wallet : ${user.wallet}\n🏦 Bank   : ${user.bank}\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);

}

// COINFLIP (25% WIN) if (cmd === "cf" || cmd === "coinflip") { let bet = parseInt(args[0]);

if (isNaN(bet) || bet <= 0) return message.reply("Enter a valid bet amount.");

if (user.wallet < bet) return message.reply("Not enough coins.");

const flipMsg = await message.reply(`\n━━━━━━━━━━━━━━━━━━━━━━\n\n🪙 Coinflip\n\nBet : ${bet}\n\nFlipping...\n\n🪙 ➜ 🔄 ➜ 🪙\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);

setTimeout(() => {
  const win = Math.random() < 0.25; // 25% chance

  if (win) {
    const reward = bet * 2;
    user.wallet += reward;

    flipMsg.edit(`\n━━━━━━━━━━━━━━━━━━━━━━\n\n🪙 Coinflip\n\nBet : ${bet}\n\nResult : HEAD\n\n🎉 You Won\n+${reward} Coins\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);
  } else {
    user.wallet -= bet;

    flipMsg.edit(`\n━━━━━━━━━━━━━━━━━━━━━━\n\n🪙 Coinflip\n\nBet : ${bet}\n\nResult : TAIL\n\n💀 You Lost\n-${bet} Coins\n\n━━━━━━━━━━━━━━━━━━━━━━\n`);
  }

  saveDB();

}, 2000);

}

});

client.login("YOUR_BOT_TOKEN");
