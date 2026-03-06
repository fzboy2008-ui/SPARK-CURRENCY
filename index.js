/* ================== PART 1: CORE BOT + DATABASE + RANK SYSTEM ================== */

const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const prefix = "s ";

/* ================== DATABASE ================== */

if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json", "{}");

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
      xp: 0,
      rank: 0,
      dragon: null,
      inventory: {
        dragons: [],
        weapons: [],
        armours: [],
      },
      lastDaily: 0,
      wins: 0,
      loses: 0,
    };
  }
  return users[id];
}

/* ================== READY EVENT ================== */

client.once("ready", () => {
  console.log("⚡ Spark Bot Online");
});

/* ================== XP / RANK SYSTEM ================== */

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  const user = getUser(msg.author.id);

  // 1 chat = 1 XP
  user.xp += 1;

  // XP needed per rank
  const needed = 2500;

  if (user.xp >= needed) {
    user.xp -= needed; // reset XP for next rank
    user.rank += 1;

    // Reward per rank up
    const coinReward = 5000;
    const gemReward = 5;
    user.wallet += coinReward;
    user.gems += gemReward;

    msg.channel.send(`
🏆 **RANK UP**

${msg.author}

New Rank: ${user.rank}

Reward: ${coinReward} coins + ${gemReward} gems
`);
  }

  save();
});

/* ================== COMMAND HANDLER ================== */

client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const user = getUser(msg.author.id);

  /* ================== HELP ================== */
  if (cmd === "help") {
    msg.reply(`
⚡ **SPARK BOT COMMANDS**

💰 Economy
s bal
s deposit
s withdraw
s give

🎁 Rewards
s daily

👤 Profile
s profile
s rank
s inv

🎮 Games
s cf
s slot

⚔ Battle
s challenge / s accept

🏆 Leaderboard
s lb c
s lb b
`);
  }

  /* ================== RANK INFO ================== */
  if (cmd === "rank") {
    msg.reply(`
🏅 **RANK INFO**

Rank: ${user.rank}
XP: ${user.xp}/2500
`);
  }

  save();
});

/* ================== SAVE ON EXIT ================== */
process.on("exit", () => {
  save();
});

/* ================== PART 2: ECONOMY + DAILY + COINFLIP + SLOT ================== */

/* ================== BALANCE ================== */
if (cmd === "bal") {
  msg.reply(`
💰 **${msg.author.username} Balance**

👛 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
`);
}

/* ================== DEPOSIT ================== */
if (cmd === "deposit") {
  let amount = args[0];
  if (amount === "all") amount = user.wallet;
  amount = parseInt(amount);
  if (!amount || amount <= 0) return msg.reply("Enter valid amount");
  if (amount > user.wallet) return msg.reply("Not enough wallet coins");

  user.wallet -= amount;
  user.bank += amount;

  save();
  msg.reply(`🏦 Deposited ${amount} coins`);
}

/* ================== WITHDRAW ================== */
if (cmd === "withdraw") {
  let amount = args[0];
  if (amount === "all") amount = user.bank;
  amount = parseInt(amount);
  if (!amount || amount <= 0) return msg.reply("Enter valid amount");
  if (amount > user.bank) return msg.reply("Not enough bank coins");

  user.bank -= amount;
  user.wallet += amount;

  save();
  msg.reply(`👛 Withdrawn ${amount} coins`);
}

/* ================== GIVE ================== */
if (cmd === "give") {
  let target = msg.mentions.users.first();
  let amount = parseInt(args[1]);
  if (!target) return msg.reply("Mention user");
  if (!amount || amount <= 0) return msg.reply("Enter amount");
  if (amount > user.wallet) return msg.reply("Not enough coins");

  let targetUser = getUser(target.id);
  user.wallet -= amount;
  targetUser.wallet += amount;

  save();
  msg.reply(`💸 Sent ${amount} coins to ${target.username}`);
}

/* ================== DAILY ================== */
if (cmd === "daily") {
  let now = Date.now();
  if (now - user.lastDaily < 86400000) {
    return msg.reply("⏳ You already claimed daily reward");
  }

  const rewardCoins = 500;
  const rewardGems = 2;

  user.wallet += rewardCoins;
  user.gems += rewardGems;
  user.lastDaily = now;

  save();
  msg.reply(`
🎁 **DAILY REWARD**

You received ${rewardCoins} coins + ${rewardGems} gems
`);
}

/* ================== COINFLIP ================== */
if (cmd === "cf" || cmd === "coinflip") {
  let bet = args[0];
  if (bet === "all") bet = user.wallet;
  bet = parseInt(bet);
  if (!bet || bet <= 0) return msg.reply("Enter bet");
  if (bet > user.wallet) return msg.reply("Not enough coins");

  msg.reply("🪙 Flipping coin...");

  setTimeout(() => {
    const win = Math.random() < 0.5;
    if (win) {
      user.wallet += bet; // 2x reward logic applied here
      msg.channel.send(`
🪙 **COINFLIP RESULT**

✨ YOU WON!
Bet: ${bet}
New Wallet Balance: ${user.wallet}
`);
    } else {
      user.wallet -= bet;
      msg.channel.send(`
🪙 **COINFLIP RESULT**

💀 YOU LOST
Lost: ${bet}
New Wallet Balance: ${user.wallet}
`);
    }
    save();
  }, 2000);
}

/* ================== SLOT MACHINE ================== */
if (cmd === "slot") {
  let bet = args[0];
  if (bet === "all") bet = user.wallet;
  bet = parseInt(bet);
  if (!bet || bet <= 0) return msg.reply("Enter bet");
  if (bet > user.wallet) return msg.reply("Not enough coins");

  const symbols = ["💎", "🥭", "🍉"];
  let spinMsg = await msg.reply("🎰 **Spinning the slot...**");

  // Animated spinning simulation
  let spinResult = [];
  for (let i = 0; i < 5; i++) {
    spinResult = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
    await spinMsg.edit(`🎰 | ${spinResult.join(" | ")} |`);
    await new Promise((r) => setTimeout(r, 600)); // 0.6s per spin frame
  }

  const [s1, s2, s3] = spinResult;
  let resultText = "";
  let reward = 0;

  if (s1 === "💎" && s2 === "💎" && s3 === "💎") {
    reward = bet * 3;
    user.wallet += reward;
    resultText = `🎰 | ${s1} | ${s2} | ${s3} |\n💎 JACKPOT! Won ${reward} coins`;
  } else if (s1 === "🥭" && s2 === "🥭" && s3 === "🥭") {
    reward = bet * 2;
    user.wallet += reward;
    resultText = `🎰 | ${s1} | ${s2} | ${s3} |\n🥭 WIN! Won ${reward} coins`;
  } else if (s1 === "🍉" && s2 === "🍉" && s3 === "🍉") {
    resultText = `🎰 | ${s1} | ${s2} | ${s3} |\n🍉 TIE! Bet returned`;
  } else {
    user.wallet -= bet;
    resultText = `🎰 | ${s1} | ${s2} | ${s3} |\n💀 LOSE! Lost ${bet} coins`;
  }

  await spinMsg.edit(resultText);
  save();
     }
/* ================== PART 3: DRAGONS SYSTEM ================== */

/* ================== DRAGON SHOP ================== */
if (cmd === "dragons") {
  msg.reply(`
🐉 **DRAGON SHOP**

1️⃣ FIRE_DRAGON — 5,000,000 coins  
2️⃣ ICE_DRAGON — 6,000,000 coins  
3️⃣ WIND_DRAGON — 7,000,000 coins  
4️⃣ LIGHTNING_DRAGON — 8,000,000 coins  
5️⃣ EARTH_DRAGON — 10,000,000 coins  

Use:
s buy dragon <dragon_name>
`);
}

/* ================== BUY DRAGON ================== */
if (cmd === "buy") {
  let type = args[0];
  let name = args[1]?.toUpperCase();
  if (type === "dragon") {
    const dragonPrices = {
      FIRE_DRAGON: 5000000,
      ICE_DRAGON: 6000000,
      WIND_DRAGON: 7000000,
      LIGHTNING_DRAGON: 8000000,
      EARTH_DRAGON: 10000000,
    };
    if (!dragonPrices[name]) return msg.reply("Invalid dragon name");
    if (user.wallet < dragonPrices[name]) return msg.reply("Not enough coins");

    if (user.inventory.dragons.includes(name)) return msg.reply("You already own this dragon");

    user.wallet -= dragonPrices[name];
    user.inventory.dragons.push(name);
    save();
    msg.reply(`🐉 Bought **${name}** dragon!`);
  }
}

/* ================== SELECT DRAGON ================== */
if (cmd === "set") {
  let dragon = args[0]?.toUpperCase();
  if (!user.inventory.dragons.includes(dragon)) return msg.reply("You don't own this dragon");
  user.dragon = dragon;
  save();
  msg.reply(`🐉 Selected dragon: **${dragon}**`);
}

/* ================== FEED DRAGON ================== */
if (cmd === "feed") {
  if (!user.dragon) return msg.reply("No dragon selected. Use s set <dragon_name>");
  if (user.gems < 100) return msg.reply("Need 100 gems to feed dragon");

  user.gems -= 100;

  if (!user.dragonsLevel) user.dragonsLevel = {};
  if (!user.dragonsLevel[user.dragon]) user.dragonsLevel[user.dragon] = 1;

  user.dragonsLevel[user.dragon] += 1;

  save();
  msg.reply(`🐉 **${user.dragon}** leveled up to **Level ${user.dragonsLevel[user.dragon]}**`);
}

/* ================== PROFILE ================== */
if (cmd === "profile" || cmd === "p") {
  let dragonLevel = user.dragon ? user.dragonsLevel?.[user.dragon] || 1 : "None";
  msg.reply(`
👤 **PROFILE**

Name: ${msg.author.username}  
🏅 Rank: ${user.level}  
XP: ${user.xp}  
🐉 Dragon: ${user.dragon || "None"} (Level: ${dragonLevel})  
⚔ Wins: ${user.wins}  
💀 Loses: ${user.loses}
`);
}
/* ================== PART 5: COINFLIP & ANIMATED SLOT ================== */

/* ================== COINFLIP ================== */
if (cmd === "cf" || cmd === "coinflip") {
  let bet = args[0];
  if (bet === "all") bet = user.wallet;
  bet = parseInt(bet);

  if (!bet || bet <= 0) return msg.reply("Enter a valid bet");
  if (bet > user.wallet) return msg.reply("Not enough coins");
  if (bet > 200000) bet = 200000;

  msg.reply("🪙 Flipping the coin...");

  // Animated coinflip simulation
  setTimeout(() => {
    let win = Math.random() < 0.5; // 50% chance
    if (win) {
      user.wallet += bet; // 2x total = bet returned + bet won
      msg.channel.send(`
🪙 **COINFLIP RESULT**

✨ **YOU WON!**  
Bet: ${bet}  
Total coins added: ${bet}  
New Balance: ${user.wallet}
`);
    } else {
      user.wallet -= bet;
      msg.channel.send(`
🪙 **COINFLIP RESULT**

💀 **YOU LOST**  
Lost: ${bet}  
New Balance: ${user.wallet}
`);
    }
    save();
  }, 2500);
}

/* ================== SLOT MACHINE ================== */
if (cmd === "slot") {
  let bet = args[0];
  if (bet === "all") bet = user.wallet;
  bet = parseInt(bet);

  if (!bet || bet <= 0) return msg.reply("Enter a valid bet");
  if (bet > user.wallet) return msg.reply("Not enough coins");
  if (bet > 200000) bet = 200000;

  const symbols = ["💎", "🥭", "🍉"];
  const spinMsg = await msg.reply("🎰 Spinning the slots...");

  // Animated spinning effect (3 steps)
  let spin1 = symbols[Math.floor(Math.random() * 3)];
  let spin2 = symbols[Math.floor(Math.random() * 3)];
  let spin3 = symbols[Math.floor(Math.random() * 3)];

  await new Promise(r => setTimeout(r, 1000));
  await spinMsg.edit(`🎰 | ${spin1} | ? | ? |`);
  await new Promise(r => setTimeout(r, 1000));
  await spinMsg.edit(`🎰 | ${spin1} | ${spin2} | ? |`);
  await new Promise(r => setTimeout(r, 1000));
  await spinMsg.edit(`🎰 | ${spin1} | ${spin2} | ${spin3} |`);

  // Determine result
  let reward = 0;
  let resultText = "";
  if (spin1 === "💎" && spin2 === "💎" && spin3 === "💎") {
    reward = bet * 3;
    user.wallet += reward;
    resultText = `💎 **JACKPOT!** Won ${reward} coins!`;
  } else if (spin1 === "🥭" && spin2 === "🥭" && spin3 === "🥭") {
    reward = bet * 2;
    user.wallet += reward;
    resultText = `🥭 **WIN!** Won ${reward} coins!`;
  } else if (spin1 === "🍉" && spin2 === "🍉" && spin3 === "🍉") {
    resultText = `🍉 **TIE!** Bet returned.`;
  } else {
    user.wallet -= bet;
    resultText = `💀 **LOSE!** Lost ${bet} coins.`;
  }

  await new Promise(r => setTimeout(r, 500));
  spinMsg.edit(`
🎰 **SLOT MACHINE RESULT**  
| ${spin1} | ${spin2} | ${spin3} |

${resultText}  
New Balance: ${user.wallet}
`);

  save();
}
/* ================== LOGIN ================== */
client.login(process.env.TOKEN);
