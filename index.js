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

// ================= PREFIX =================

const PREFIXES = ["s", "spark"];

function getPrefix(message) {

  const msg = message.content.toLowerCase();

  for (const p of PREFIXES) {
    if (msg.startsWith(p + " ")) return p;
  }

}

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
      lastDaily: 0
    };

  }

  return users[id];

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

  const MAX_BET = 100000;

  // ================= HELP =================

  if (cmd === "help") {

    const embed = new EmbedBuilder()

      .setColor("Blue")
      .setTitle("⚡ SPARK BOT COMMANDS")

      .setDescription(
`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 ECONOMY
\`s daily\`
\`s bal\`
\`s deposit <amount>\`
\`s withdraw <amount>\`

🎰 CASINO
\`s cf <amount/all>\`
\`s slot <amount/all>\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
);

    return message.reply({ embeds: [embed] });

  }

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

💵 Wallet : ${user.wallet}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
);

    return message.reply({ embeds: [embed] });

  }

  // ================= DEPOSIT =================

  if (cmd === "deposit") {

    const amount = parseInt(args[0]);

    if (!amount || amount <= 0)
      return message.reply("Enter valid amount");

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

    if (!amount || amount <= 0)
      return message.reply("Enter valid amount");

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

  // ================= COINFLIP =================

  if (cmd === "cf") {

    let amount = args[0];

    if (!amount) return message.reply("Enter bet amount");

    let bet;

    if (amount === "all") bet = Math.min(user.wallet, MAX_BET);
    else bet = parseInt(amount);

    if (!bet || bet <= 0) return message.reply("Invalid bet");

    if (bet > MAX_BET) return message.reply("Max bet is 100000");

    if (user.wallet < bet) return message.reply("Not enough coins");

    user.wallet -= bet;
    save();

    const msg = await message.reply("🪙 Flipping coin...");

    const animation = ["🪙", "💿", "🪙", "💿"];

    for (const a of animation) {

      await new Promise(r => setTimeout(r, 500));

      await msg.edit(`${a} Flipping...`);

    }

    const win = Math.random() < 0.25;

    if (win) {

      const winnings = bet * 2;

      user.wallet += winnings;

      save();

      return msg.edit(
`🪙 **Coinflip Result**

🎉 You Won!

💰 Won : ${winnings}`
);

    } else {

      return msg.edit(
`🪙 **Coinflip Result**

💀 You Lost : ${bet}`
);

    }

  }

  // ================= SLOT =================

  if (cmd === "slot") {

    let amount = args[0];

    if (!amount) return message.reply("Enter bet amount");

    let bet;

    if (amount === "all") bet = Math.min(user.wallet, MAX_BET);
    else bet = parseInt(amount);

    if (!bet || bet <= 0) return message.reply("Invalid bet");

    if (bet > MAX_BET) return message.reply("Max bet is 100000");

    if (user.wallet < bet) return message.reply("Not enough coins");

    user.wallet -= bet;
    save();

    const slots = ["💎","🥭","🍒","🍉"];

    const msg = await message.reply("🎰 Spinning...");

    let roll;

    for (let i = 0; i < 3; i++) {

      roll = [
        slots[Math.floor(Math.random()*slots.length)],
        slots[Math.floor(Math.random()*slots.length)],
        slots[Math.floor(Math.random()*slots.length)]
      ];

      await new Promise(r => setTimeout(r, 700));

      await msg.edit(`🎰 ${roll.join(" ")}`);

    }

    const win = Math.random() < 0.50;

    if (!win) return msg.edit(`🎰 ${roll.join(" ")}\n\n💀 You Lost ${bet}`);

    let multiplier = 0;

    if (roll[0]==="💎" && roll[1]==="💎" && roll[2]==="💎") multiplier = 3;
    else if (roll[0]==="🥭" && roll[1]==="🥭" && roll[2]==="🥭") multiplier = 2;
    else if (roll[0]==="🍒" && roll[1]==="🍒" && roll[2]==="🍒") multiplier = 2;
    else if (roll[0]==="🍉" && roll[1]==="🍉" && roll[2]==="🍉") multiplier = 1;

    const winnings = bet * multiplier;

    user.wallet += winnings;

    save();

    msg.edit(
`🎰 ${roll.join(" ")}

💰 Multiplier : ${multiplier}x
🏆 Won : ${winnings}`
);

  }

});

// ================= LOGIN =================

client.login(process.env.TOKEN);
