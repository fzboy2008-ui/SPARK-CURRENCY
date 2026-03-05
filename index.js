const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = "s";
let users = {};
let dailyCooldown = {};

function getUser(id) {
  if (!users[id]) {
    users[id] = {
      wallet: 0,
      bank: 0,
      chats: 0,
      level: 0
    };
  }
  return users[id];
}

function progressBar(current, required) {
  const size = 12;
  const percent = current / required;
  const progress = Math.min(size, Math.round(size * percent));
  return "🟪".repeat(progress) + "⬛".repeat(size - progress);
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const user = getUser(message.author.id);
  user.chats++;

  let requiredChats = (user.level + 1) * 2500;

  if (user.chats >= requiredChats) {
    user.level++;
    let reward = user.level * 5000;
    user.wallet += reward;

    message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#00ff99")
          .setTitle("🎉 LEVEL UP!")
          .setDescription(`${message.author} reached **Level ${user.level}**`)
          .addFields({ name: "Reward", value: `💰 ${reward} coins` })
      ]
    });
  }

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift()?.toLowerCase();

  // DAILY
  if (cmd === "daily") {
    const now = Date.now();
    if (dailyCooldown[message.author.id] && now - dailyCooldown[message.author.id] < 86400000)
      return message.reply("⏳ Daily already claimed.");

    dailyCooldown[message.author.id] = now;
    user.wallet += 500;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#3498db")
          .setTitle("🎁 Daily Reward")
          .setDescription("You received **💰 500 coins**")
      ]
    });
  }

  // CASH
  if (cmd === "cash") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#f1c40f")
          .setTitle(`${message.author.username}'s Balance`)
          .addFields(
            { name: "💵 Wallet", value: `${user.wallet}`, inline: true },
            { name: "🏦 Bank", value: `${user.bank}`, inline: true }
          )
      ]
    });
  }

  // PROFILE
  if (cmd === "profile") {
    let required = (user.level + 1) * 2500;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#9b59b6")
          .setTitle(`👤 ${message.author.username}'s Profile`)
          .setThumbnail(message.author.displayAvatarURL())
          .addFields(
            { name: "💎 Level", value: `${user.level}`, inline: true },
            { name: "💬 Chats", value: `${user.chats}`, inline: true },
            { name: "💰 Wallet", value: `${user.wallet}`, inline: true },
            { name: "🏦 Bank", value: `${user.bank}`, inline: true },
            { name: "📊 Progress", value: progressBar(user.chats, required) }
          )
      ]
    });
  }

  // COINFLIP (30% WIN + ANIMATION)
  if (cmd === "cf") {
    let amount = args[0] === "all"
      ? Math.min(user.wallet, 500000)
      : parseInt(args[0]);

    if (!amount || amount > user.wallet)
      return message.reply("Invalid amount.");

    const flipMsg = await message.channel.send("🪙 Flipping the coin...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    let win = Math.random() < 0.3; // 30% win rate

    if (win) {
      user.wallet += amount;
      flipMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor("#2ecc71")
            .setTitle("🪙 Coin Flip Result")
            .setDescription(`🎉 **YOU WON!**\nEarned 💰 ${amount} coins`)
        ]
      });
    } else {
      user.wallet -= amount;
      flipMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor("#e74c3c")
            .setTitle("🪙 Coin Flip Result")
            .setDescription(`💀 **YOU LOST!**\nLost 💰 ${amount} coins`)
        ]
      });
    }
  }

  // LEADERBOARD
  if (cmd === "leaderboard" || cmd === "lb") {
    let sorted = Object.entries(users)
      .sort((a, b) =>
        (b[1].wallet + b[1].bank) -
        (a[1].wallet + a[1].bank)
      )
      .slice(0, 10);

    let desc = sorted.map((u, i) =>
      `**${i + 1}.** <@${u[0]}> — 💰 ${u[1].wallet + u[1].bank}`
    ).join("\n");

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#ffaa00")
          .setTitle("🏆 Top 10 Richest Players")
          .setDescription(desc || "No data yet.")
      ]
    });
  }

});

client.login(process.env.TOKEN);
