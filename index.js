const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const prefix = "s";
const DB_FILE = "./database.json";

let db = {};
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getUser(id) {
  if (!db[id]) {
    db[id] = {
      wallet: 0,
      bank: 0,
      chats: 0,
      level: 0,
      lastDaily: 0
    };
  }
  return db[id];
}

function levelRequirement(level) {
  return 2500 * (level + 1);
}

function levelReward(level) {
  return 5000 * (level + 1);
}

function progressBar(current, required) {
  const percent = current / required;
  const filled = Math.floor(percent * 12);
  return "🟪".repeat(filled) + "⬛".repeat(12 - filled);
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  // LEVEL SYSTEM
  user.chats++;
  const required = levelRequirement(user.level);
  if (user.chats >= required) {
    user.level++;
    const reward = levelReward(user.level - 1);
    user.wallet += reward;
    message.channel.send(`🎉 ${message.author} leveled up to **${user.level}** and earned 💰 ${reward} coins!`);
  }
  saveDB();

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  // HELP
  if (cmd === "help") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Purple")
          .setTitle("📜 Commands")
          .setDescription(`
🎁 s daily
💰 s cash
👤 s profile
📊 s lvl
🎲 s cf <amount|all>
🏦 s deposit <amount>
🏧 s withdraw <amount>
💸 s give @user <amount>
🏆 s leaderboard

👑 ADMIN:
s setmoney @user <amount>
s reset @user
s reset all
`)
      ]
    });
  }

  // DAILY
  if (cmd === "daily") {
    if (Date.now() - user.lastDaily < 86400000)
      return message.reply("❌ Already claimed daily.");
    user.wallet += 500;
    user.lastDaily = Date.now();
    saveDB();
    return message.reply("🎁 You received 💰 500 coins!");
  }

  // CASH
  if (cmd === "cash") {
    return message.reply(`💵 Wallet: ${user.wallet}\n🏦 Bank: ${user.bank}`);
  }

  // LVL
  if (cmd === "lvl") {
    const required = levelRequirement(user.level);
    const current = user.chats % required;
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Purple")
          .setTitle(`${message.author.username}'s Level`)
          .addFields(
            { name: "💎 Level", value: `${user.level}`, inline: true },
            { name: "💬 Chats", value: `${user.chats}`, inline: true },
            { name: "📈 Progress", value: `${current}/${required}` },
            { name: "📊 Bar", value: progressBar(current, required) }
          )
      ]
    });
  }

  // PROFILE
  if (cmd === "profile") {
    const required = levelRequirement(user.level);
    const current = user.chats % required;
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setThumbnail(message.author.displayAvatarURL())
          .setTitle(`${message.author.username}'s Profile`)
          .addFields(
            { name: "💎 Level", value: `${user.level}`, inline: true },
            { name: "💰 Wallet", value: `${user.wallet}`, inline: true },
            { name: "🏦 Bank", value: `${user.bank}`, inline: true },
            { name: "📊 Progress", value: progressBar(current, required) }
          )
      ]
    });
  }

  // COINFLIP
  if (cmd === "cf") {
    let amount = args[0] === "all"
      ? Math.min(user.wallet, 500000)
      : parseInt(args[0]);

    if (!amount || amount <= 0) return message.reply("Invalid amount.");
    if (amount > user.wallet) return message.reply("Not enough balance.");

    const msg = await message.reply("🪙 Flipping the coin...");
    setTimeout(() => {
      const win = Math.random() < 0.3;
      if (win) {
        user.wallet += amount;
        msg.edit(`🎉 YOU WON! +${amount} coins`);
      } else {
        user.wallet -= amount;
        msg.edit(`💀 YOU LOST! -${amount} coins`);
      }
      saveDB();
    }, 1500);
  }

  // DEPOSIT
  if (cmd === "deposit") {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return;
    if (amount > user.wallet) return message.reply("Not enough wallet.");
    user.wallet -= amount;
    user.bank += amount;
    saveDB();
    return message.reply(`🏦 Deposited ${amount}`);
  }

  // WITHDRAW
  if (cmd === "withdraw") {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return;
    if (amount > user.bank) return message.reply("Not enough bank.");
    user.bank -= amount;
    user.wallet += amount;
    saveDB();
    return message.reply(`🏧 Withdrawn ${amount}`);
  }

  // GIVE
  if (cmd === "give") {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || !amount) return;
    if (amount > user.wallet) return message.reply("Not enough balance.");
    const tUser = getUser(target.id);
    user.wallet -= amount;
    tUser.wallet += amount;
    saveDB();
    return message.reply(`💸 Sent ${amount} coins to ${target.username}`);
  }

  // LEADERBOARD
  if (cmd === "leaderboard" || cmd === "lb") {
    const top = Object.entries(db)
      .sort((a, b) => (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank))
      .slice(0, 10);

    let desc = "";
    top.forEach((u, i) => {
      desc += `**${i + 1}.** <@${u[0]}> — 💰 ${u[1].wallet + u[1].bank}\n`;
    });

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Gold")
          .setTitle("🏆 Leaderboard")
          .setDescription(desc)
      ]
    });
  }

  // ADMIN
  if (cmd === "setmoney") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || !amount) return;
    getUser(target.id).wallet = amount;
    saveDB();
    return message.reply("Money set.");
  }

  if (cmd === "reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
    if (args[0] === "all") {
      db = {};
      saveDB();
      return message.reply("All data reset.");
    }
    const target = message.mentions.users.first();
    if (!target) return;
    db[target.id] = { wallet: 0, bank: 0, chats: 0, level: 0, lastDaily: 0 };
    saveDB();
    return message.reply("User reset.");
  }
});

client.login(process.env.TOKEN);
