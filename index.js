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
const DAILY_COOLDOWN = 86400000;

// Load database
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

  const prefixUsed = prefixList.find(p =>
    message.content.toLowerCase().startsWith(p.toLowerCase())
  );

  if (!prefixUsed) return;

  const args = message.content
    .slice(prefixUsed.length)
    .trim()
    .split(/ +/);

  const cmd = args.shift().toLowerCase();

  const user = getUser(message.author.id);

  // ================= BAL =================

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

  // ================= DAILY =================

  if (cmd === "daily") {

    const now = Date.now();

    if (now - user.lastDaily < DAILY_COOLDOWN) {

      const remaining = DAILY_COOLDOWN - (now - user.lastDaily);

      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);

      return message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

You already claimed today's reward.

⏱ Next Daily In
${hours}h ${minutes}m ${seconds}s

━━━━━━━━━━━━━━━━━━━━━━`
      );

    }

    user.wallet += 1000;
    user.lastDaily = now;

    saveDB();

    return message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

🎁 Daily Reward Claimed

+1000 Coins added to wallet

⏱ Come back again in 24h

━━━━━━━━━━━━━━━━━━━━━━`
    );

  }

  // ================= GIVE =================

  if (cmd === "give") {

    const target = message.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || isNaN(amount)) return;

    if (user.wallet < amount) {
      return message.reply("Not enough coins.");
    }

    const targetUser = getUser(target.id);

    user.wallet -= amount;
    targetUser.wallet += amount;

    saveDB();

    return message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

💸 Coins Sent

Sender : ${message.author.username}
Receiver : ${target.username}

Amount : ${amount}

━━━━━━━━━━━━━━━━━━━━━━`
    );

  }

  // ================= DEPOSIT =================

  if (cmd === "deposit") {

    const amount = parseInt(args[0]);

    if (isNaN(amount)) return;

    if (user.wallet < amount) {
      return message.reply("Not enough coins.");
    }

    user.wallet -= amount;
    user.bank += amount;

    saveDB();

    return message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

🏦 Bank Deposit

Amount : ${amount}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━`
    );

  }

  // ================= WITHDRAW =================

  if (cmd === "withdraw") {

    const amount = parseInt(args[0]);

    if (isNaN(amount)) return;

    if (user.bank < amount) {
      return message.reply("Not enough coins.");
    }

    user.bank -= amount;
    user.wallet += amount;

    saveDB();

    return message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

🏧 Bank Withdraw

Amount : ${amount}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━`
    );

  }

  // ================= COINFLIP =================

  if (cmd === "cf" || cmd === "coinflip") {

    const bet = parseInt(args[0]);

    if (isNaN(bet) || bet <= 0) {
      return message.reply("Enter a valid bet amount.");
    }

    if (user.wallet < bet) {
      return message.reply("Not enough coins.");
    }

    const flipMsg = await message.reply(
`━━━━━━━━━━━━━━━━━━━━━━

🪙 Coinflip

Bet : ${bet}

Flipping...

🪙 ➜ 🔄 ➜ 🪙

━━━━━━━━━━━━━━━━━━━━━━`
    );

    setTimeout(() => {

      const win = Math.random() < 0.25;

      if (win) {

        const reward = bet * 2;
        user.wallet += reward;

        flipMsg.edit(
`━━━━━━━━━━━━━━━━━━━━━━

🪙 Coinflip

Bet : ${bet}

Result : HEAD

🎉 You Won
+${reward} Coins

━━━━━━━━━━━━━━━━━━━━━━`
        );

      } else {

        user.wallet -= bet;

        flipMsg.edit(
`━━━━━━━━━━━━━━━━━━━━━━

🪙 Coinflip

Bet : ${bet}

Result : TAIL

💀 You Lost
-${bet} Coins

━━━━━━━━━━━━━━━━━━━━━━`
        );

      }

      saveDB();

    }, 2000);

  }

});

// Railway ENV token
client.login(process.env.TOKEN);
