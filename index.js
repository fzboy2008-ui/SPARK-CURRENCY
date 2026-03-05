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
const MAX_BET = 500000;
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
    db[id] = { wallet: 0, bank: 0, chats: 0, level: 0, lastDaily: 0 };
  }
  return db[id];
}

function levelRequirement(level) {
  return 2500 * (level + 1);
}

function levelReward(level) {
  return 5000 * (level + 1);
}

function getBetAmount(input, wallet) {
  if (!input) return null;

  let amount = input.toLowerCase() === "all"
    ? wallet
    : parseInt(input);

  if (isNaN(amount) || amount <= 0) return null;

  amount = Math.min(amount, wallet);
  amount = Math.min(amount, MAX_BET);

  return amount;
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);

  // ===== XP SYSTEM =====
  user.chats++;
  const requiredXP = levelRequirement(user.level);

  if (user.chats >= requiredXP) {
    user.level++;
    const reward = levelReward(user.level - 1);
    user.wallet += reward;
    message.channel.send(`🎉 ${message.author} ranked up to **${user.level}** and earned 💰 ${reward} coins!`);
  }

  saveDB();

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  // ===== HELP =====
  if (cmd === "help") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Purple")
          .setTitle("✨ Available Commands")
          .setDescription(`
🎁 s daily
💰 s cash
👤 s profile
📊 s lvl
🎲 s cf
🎰 s slot
🏦 s deposit
🏧 s withdraw
💸 s give
🏆 s leaderboard
`)
      ]
    });
  }

  // ===== DAILY =====
  if (cmd === "daily") {
    const cooldown = 86400000;
    const remaining = cooldown - (Date.now() - user.lastDaily);

    if (remaining > 0) {
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      return message.reply(`⏳ Next daily in ${hours}h ${minutes}m`);
    }

    user.wallet += 500;
    user.lastDaily = Date.now();
    saveDB();
    return message.reply("🎁 Daily Reward Claimed! +500 coins 💰");
  }

  // ===== CASH =====
  if (cmd === "cash") {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("💳 Balance Overview")
          .setDescription(`👤 User: ${message.author.username}`)
          .addFields(
            { name: "💵 Wallet", value: `${user.wallet}`, inline: true },
            { name: "🏦 Bank", value: `${user.bank}`, inline: true }
          )
      ]
    });
  }

  // ===== LVL =====
  if (cmd === "lvl") {
    const required = levelRequirement(user.level);
    const current = user.chats % required;
    const percent = ((current / required) * 100).toFixed(1);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Purple")
          .setTitle(`📊 ${message.author.username}'s Rank`)
          .addFields(
            { name: "🏅 Rank", value: `${user.level}`, inline: true },
            { name: "⚡ XP", value: `${current}/${required}`, inline: true },
            { name: "📈 Progress", value: `${percent}%` }
          )
      ]
    });
  }

  // ===== PROFILE =====
  if (cmd === "profile") {
    const required = levelRequirement(user.level);
    const current = user.chats % required;
    const percent = ((current / required) * 100).toFixed(1);

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Blue")
          .setThumbnail(message.author.displayAvatarURL())
          .setTitle(`👤 ${message.author.username}'s Profile`)
          .addFields(
            { name: "🏅 Rank", value: `${user.level}`, inline: true },
            { name: "💰 Wallet", value: `${user.wallet}`, inline: true },
            { name: "🏦 Bank", value: `${user.bank}`, inline: true },
            { name: "📊 XP Progress", value: `${percent}%` }
          )
      ]
    });
  }

  // ===== COIN FLIP =====
  if (cmd === "cf") {
    const amount = getBetAmount(args[0], user.wallet);
    if (!amount) return message.reply("Enter valid amount.");

    const msg = await message.reply(`🪙 Flipping ${amount} coins...`);

    setTimeout(() => {
      const win = Math.random() < 0.5;

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

  // ===== ANIMATED SLOT =====
  if (cmd === "slot") {
    const amount = getBetAmount(args[0], user.wallet);
    if (!amount) return message.reply("Enter valid amount.");

    const symbols = ["💎", "🍒", "🍉", "🍋", "⭐"];
    const msg = await message.reply("🎰 Spinning...\n| ❔ | ❔ | ❔ |");

    let spins = 0;
    const maxSpins = 4;
    let finalRoll = [];

    const interval = setInterval(async () => {
      finalRoll = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      spins++;
      await msg.edit(`🎰 Spinning...\n| ${finalRoll.join(" | ")} |`);

      if (spins >= maxSpins) {
        clearInterval(interval);

        let result = "";

        if (finalRoll.every(s => s === "💎")) {
          const reward = amount * 3;
          user.wallet += reward;
          result = `💎 JACKPOT! +${reward}`;
        }
        else if (finalRoll.every(s => s === "🍒")) {
          const reward = amount * 2;
          user.wallet += reward;
          result = `🍒 DOUBLE WIN! +${reward}`;
        }
        else if (finalRoll.every(s => s === "🍉")) {
          result = `🍉 TIE! No Win No Loss`;
        }
        else {
          user.wallet -= amount;
          result = `❌ You Lost -${amount}`;
        }

        saveDB();
        await msg.edit(`🎰 FINAL RESULT\n| ${finalRoll.join(" | ")} |\n\n${result}`);
      }
    }, 700);
  }

  // ===== DEPOSIT =====
  if (cmd === "deposit") {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.reply("Enter valid amount.");
    if (amount > user.wallet) return message.reply("Not enough wallet.");
    user.wallet -= amount;
    user.bank += amount;
    saveDB();
    return message.reply(`🏦 Deposited ${amount}`);
  }

  // ===== WITHDRAW =====
  if (cmd === "withdraw") {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return message.reply("Enter valid amount.");
    if (amount > user.bank) return message.reply("Not enough bank.");
    user.bank -= amount;
    user.wallet += amount;
    saveDB();
    return message.reply(`🏧 Withdrawn ${amount}`);
  }

  // ===== GIVE =====
  if (cmd === "give") {
    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || !amount || amount <= 0)
      return message.reply("Usage: s give @user amount");
    if (amount > user.wallet)
      return message.reply("Not enough balance.");

    const tUser = getUser(target.id);
    user.wallet -= amount;
    tUser.wallet += amount;
    saveDB();
    return message.reply(`💸 Sent ${amount} coins to ${target.username}`);
  }

  // ===== LEADERBOARD =====
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
          .setDescription(desc || "No data yet.")
      ]
    });
  }

  // ===== ADMIN =====
  if (cmd === "setmoney") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Not allowed.");

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);
    if (!target || isNaN(amount))
      return message.reply("Usage: s setmoney @user amount");

    getUser(target.id).wallet = amount;
    saveDB();
    return message.reply("Money updated.");
  }

  if (cmd === "reset") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return message.reply("❌ Not allowed.");

    if (args[0] === "all") {
      db = {};
      saveDB();
      return message.reply("All data reset.");
    }

    const target = message.mentions.users.first();
    if (!target) return message.reply("Mention a user.");

    db[target.id] = { wallet: 0, bank: 0, chats: 0, level: 0, lastDaily: 0 };
    saveDB();
    return message.reply("User reset.");
  }

});

client.login(process.env.TOKEN);
