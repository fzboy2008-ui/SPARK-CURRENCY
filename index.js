const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIXES = ["s ", "spark "];

// ================= DATABASE =================

if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json"))
  fs.writeFileSync("./database/users.json", "{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function save() {
  fs.writeFileSync("./database/users.json", JSON.stringify(users, null, 2));
}

function getUser(id) {

  if (!users[id]) {

    users[id] = {
      wallet: 0,
      bank: 0,
      gems: 0,
      lastDaily: 0
    };

  }

  return users[id];

}

// ================= PREFIX =================

function getPrefix(msg) {

  const lower = msg.content.toLowerCase();

  return PREFIXES.find(p => lower.startsWith(p));

}

// ================= READY =================

client.once("ready", () => {

  console.log("⚡ Spark Bot Online: " + client.user.tag);

});

// ================= MESSAGE =================

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  const prefix = getPrefix(message);

  if (!prefix) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  const user = getUser(message.author.id);

  // ================= BAL =================

  if (cmd === "bal" || cmd === "balance") {

    const embed = new EmbedBuilder()

      .setColor("Gold")
      .setTitle("💰 SPARK BALANCE")

      .setDescription(
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 User : ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
);

    return message.reply({ embeds: [embed] });

  }

  // ================= DAILY =================

  if (cmd === "daily") {

    const now = Date.now();

    const cooldown = 86400000;

    if (now - user.lastDaily < cooldown) {

      const remaining = cooldown - (now - user.lastDaily);

      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      const s = Math.floor((remaining % 60000) / 1000);

      const embed = new EmbedBuilder()

        .setColor("Red")
        .setTitle("⏳ DAILY COOLDOWN")

        .setDescription(
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You already claimed today's reward.

⏱ Next Daily In
${h}h ${m}m ${s}s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
);

      return message.reply({ embeds: [embed] });

    }

    user.wallet += 1000;

    user.lastDaily = now;

    save();

    const embed = new EmbedBuilder()

      .setColor("Green")
      .setTitle("🎁 DAILY REWARD")

      .setDescription(
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Reward : 1000 Coins

💵 New Wallet : ${user.wallet}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
);

    return message.reply({ embeds: [embed] });

  }

  // ================= DEPOSIT =================

  if (cmd === "deposit") {

    const amount = parseInt(args[0]);

    if (!amount) return message.reply("Enter amount");

    if (user.wallet < amount)
      return message.reply("Not enough coins");

    user.wallet -= amount;
    user.bank += amount;

    save();

    const embed = new EmbedBuilder()

      .setColor("Blue")
      .setTitle("🏦 DEPOSIT SUCCESS")

      .setDescription(
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Deposited : ${amount}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
);

    return message.reply({ embeds: [embed] });

  }

  // ================= WITHDRAW =================

  if (cmd === "withdraw") {

    const amount = parseInt(args[0]);

    if (!amount) return message.reply("Enter amount");

    if (user.bank < amount)
      return message.reply("Not enough bank coins");

    user.bank -= amount;
    user.wallet += amount;

    save();

    const embed = new EmbedBuilder()

      .setColor("Blue")
      .setTitle("💸 WITHDRAW SUCCESS")

      .setDescription(
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Withdrawn : ${amount}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
);

    return message.reply({ embeds: [embed] });

  }

});

// ================= LOGIN =================

client.login(process.env.TOKEN);
