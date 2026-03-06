/* ================= IMPORTS ================= */
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

/* ================= CLIENT SETUP ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const prefix = "s ";

/* ================= DATABASE ================= */
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
        armours: []
      },

      lastDaily: 0,

      wins: 0,
      loses: 0
    };
  }
  return users[id];
}

/* ================= BOT READY ================= */
client.once("ready", () => {
  console.log(`⚡ Spark Bot Online as ${client.user.tag}`);
});

/* ================= XP & RANK SYSTEM ================= */
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;

  let user = getUser(msg.author.id);

  // 1 XP per message
  user.xp += 1;
  let needed = 2500; // XP per rank

  if (user.xp >= needed) {
    user.xp -= needed;
    user.rank += 1;

    // Rank-up reward
    user.wallet += 5000;
    user.gems += 5;

    msg.channel.send(`
🏆 **RANK UP!**

${msg.author.username} reached **Rank ${user.rank}**

💰 Coins: +5000
💎 Gems: +5
`);
  }

  save();
});

/* ================= COMMAND HANDLER ================= */
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();

  let user = getUser(msg.author.id);

  /* ================= HELP ================= */
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
s challenge
s accept

🏆 Leaderboard
s lb c
s lb b
`);
  }

  /* ================= BALANCE ================= */
  if (cmd === "bal") {
    msg.reply(`
💰 **${msg.author.username} Balance**

👛 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
`);
  }

  /* ================= DEPOSIT ================= */
  if (cmd === "deposit") {
    let amount = args[0];
    if (amount === "all") amount = user.wallet;
    amount = parseInt(amount);

    if (!amount || amount <= 0) return msg.reply("Enter a valid amount");
    if (amount > user.wallet) return msg.reply("Not enough wallet coins");

    user.wallet -= amount;
    user.bank += amount;

    save();
    msg.reply(`🏦 Deposited ${amount} coins`);
  }

  /* ================= WITHDRAW ================= */
  if (cmd === "withdraw") {
    let amount = args[0];
    if (amount === "all") amount = user.bank;
    amount = parseInt(amount);

    if (!amount || amount <= 0) return msg.reply("Enter a valid amount");
    if (amount > user.bank) return msg.reply("Not enough bank coins");

    user.bank -= amount;
    user.wallet += amount;

    save();
    msg.reply(`👛 Withdrawn ${amount} coins`);
  }

  /* ================= GIVE ================= */
  if (cmd === "give") {
    let target = msg.mentions.users.first();
    let amount = parseInt(args[1]);

    if (!target) return msg.reply("Mention a user to give coins");
    if (!amount || amount <= 0) return msg.reply("Enter a valid amount");
    if (amount > user.wallet) return msg.reply("Not enough coins");

    let targetUser = getUser(target.id);

    user.wallet -= amount;
    targetUser.wallet += amount;

    save();
    msg.reply(`💸 Sent ${amount} coins to ${target.username}`);
  }

  /* ================= DAILY ================= */
  if (cmd === "daily") {
    let now = Date.now();

    if (now - user.lastDaily < 86400000) {
      return msg.reply("⏳ You already claimed your daily reward!");
    }

    user.wallet += 500;
    user.lastDaily = now;

    save();
    msg.reply(`
🎁 **DAILY REWARD**

You received 500 coins!
`);
  }

  /* ================= PROFILE ================= */
  if (cmd === "profile") {
    msg.reply(`
👤 **PROFILE**

Name: ${msg.author.username}
Rank: ${user.rank}
XP: ${user.xp}/2500
🐉 Dragon: ${user.dragon || "None"}
⚔ Wins: ${user.wins}
💀 Loses: ${user.loses}
`);
  }

  /* ================= RANK ================= */
  if (cmd === "rank") {
    msg.reply(`
🏅 **RANK INFO**

Rank: ${user.rank}
XP: ${user.xp}/2500
`);
  }

  /* ================= INVENTORY ================= */
  if (cmd === "inv") {
    msg.reply(`
🎒 **INVENTORY**

🐉 Dragons: ${user.inventory.dragons.join(", ") || "None"}
⚔ Weapons: ${user.inventory.weapons.join(", ") || "None"}
🛡 Armours: ${user.inventory.armours.join(", ") || "None"}
`);
  }

});
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  let user = getUser(msg.author.id);

  /* ================= COINFLIP ================= */
  if (cmd === "cf" || cmd === "coinflip") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);

    if (!bet || bet <= 0) return msg.reply("Enter a valid bet");
    if (bet > 200000) bet = 200000;
    if (bet > user.wallet) return msg.reply("Not enough coins");

    msg.reply("🪙 **Flipping the coin...**");

    setTimeout(() => {
      let win = Math.random() < 0.20; // 20% win chance
      if (win) {
        user.wallet += bet; // 2x reward logic handled by adding bet itself
        msg.channel.send(`
🪙 **COINFLIP RESULT**

✨ YOU WON

Bet: ${bet}
Won: ${bet}
`);
      } else {
        user.wallet -= bet;
        msg.channel.send(`
🪙 **COINFLIP RESULT**

💀 YOU LOST

Lost: ${bet}
`);
      }
      save();
    }, 3000);
  }

  /* ================= SLOT MACHINE ================= */
  if (cmd === "slot") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);

    if (!bet || bet <= 0) return msg.reply("Enter a valid bet");
    if (bet > 200000) bet = 200000;
    if (bet > user.wallet) return msg.reply("Not enough coins");

    const symbols = ["💎", "🥭", "🍉"];

    // Animated spinning UI
    let spinMsg = await msg.reply("🎰 **Spinning the slot...**");
    let spinCount = 6;

    for (let i = 0; i < spinCount; i++) {
      let s1 = symbols[Math.floor(Math.random() * 3)];
      let s2 = symbols[Math.floor(Math.random() * 3)];
      let s3 = symbols[Math.floor(Math.random() * 3)];
      await spinMsg.edit(`🎰 | ${s1} | ${s2} | ${s3} |`);
      await new Promise(res => setTimeout(res, 500));
    }

    // Final result
    let s1 = symbols[Math.floor(Math.random() * 3)];
    let s2 = symbols[Math.floor(Math.random() * 3)];
    let s3 = symbols[Math.floor(Math.random() * 3)];

    let resultText = `🎰 **SLOT RESULT**\n\n| ${s1} | ${s2} | ${s3} |\n`;
    let reward = 0;

    if (s1 === s2 && s2 === s3) {
      if (s1 === "💎") {
        reward = bet * 3;
        user.wallet += reward;
        resultText += `💎 JACKPOT! Won: ${reward}`;
      } else if (s1 === "🥭") {
        reward = bet * 2;
        user.wallet += reward;
        resultText += `🥭 WIN! Won: ${reward}`;
      } else if (s1 === "🍉") {
        resultText += `🍉 TIE! Bet returned`;
      }
    } else {
      user.wallet -= bet;
      resultText += `💀 LOSE! Lost: ${bet}`;
    }

    await spinMsg.edit(resultText);
    save();
  }

  /* ================= DRAGON SHOP ================= */
  const DRAGONS = {
    FIRE_DRAGON: { price: 5000000 },
    ICE_DRAGON: { price: 6000000 },
    WIND_DRAGON: { price: 7000000 },
    LIGHTNING_DRAGON: { price: 8000000 },
    EARTH_DRAGON: { price: 10000000 }
  };

  if (cmd === "dragons") {
    let shopText = "🐉 **DRAGON SHOP**\n\n";
    for (let d in DRAGONS) {
      shopText += `🔥 ${d} — ${DRAGONS[d].price} coins\n`;
    }
    shopText += "\nBuy using: s buy dragon <dragon_name>";
    msg.reply(shopText);
  }

  if (cmd === "buy") {
    let type = args[0];
    let name = args[1]?.toUpperCase();

    if (type === "dragon") {
      if (!DRAGONS[name]) return msg.reply("Dragon not found");
      if (user.inventory.dragons.includes(name)) return msg.reply("You already own this dragon");
      if (user.wallet < DRAGONS[name].price) return msg.reply("Not enough coins");

      user.wallet -= DRAGONS[name].price;
      user.inventory.dragons.push(name);
      save();
      msg.reply(`🐉 Bought ${name} dragon`);
    }
  }

  if (cmd === "set") {
    let dragon = args[0]?.toUpperCase();
    if (!user.inventory.dragons.includes(dragon)) return msg.reply("You don't own this dragon");
    user.dragon = dragon;
    save();
    msg.reply(`🐉 Dragon set to ${dragon}`);
  }

  if (cmd === "feed") {
    if (!user.dragon) return msg.reply("No dragon selected");
    if (user.gems < 100) return msg.reply("Need 100 gems to upgrade dragon");
    user.gems -= 100;
    msg.reply(`🐉 ${user.dragon} leveled up!`);
    save();
  }
});
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  let user = getUser(msg.author.id);

  /* ================= DAILY REWARD ================= */
  if (cmd === "daily") {
    let now = Date.now();
    if (now - user.lastDaily < 86400000) return msg.reply("⏳ You already claimed your daily reward");

    user.wallet += 500;
    user.gems += 5;
    user.lastDaily = now;

    save();

    msg.reply(`
🎁 **DAILY REWARD**

💰 Coins: 500  
💎 Gems: 5
`);
  }

  /* ================= PROFILE ================= */
  if (cmd === "profile" || cmd === "p") {
    msg.reply(`
👤 **PROFILE**

Name: ${msg.author.username}  
🏅 Rank: ${user.level}  
XP: ${user.xp}  
🐉 Dragon: ${user.dragon ? user.dragon : "None"}  
⚔ Wins: ${user.wins}  
💀 Loses: ${user.loses}  
`);
  }

  /* ================= BATTLE SYSTEM ================= */
  if (cmd === "challenge") {
    let opponent = msg.mentions.users.first();
    if (!opponent) return msg.reply("Mention a user to challenge");

    msg.channel.send(`
⚔ **BATTLE CHALLENGE**

${msg.author.username} challenged ${opponent.username}!

Type s accept to accept the battle.
`);
  }

  if (cmd === "accept") {
    msg.channel.send("⚔ Battle starting...");

    setTimeout(() => {
      let members = [...msg.channel.members.values()].filter(m => !m.user.bot);
      let winnerMember = members[Math.floor(Math.random() * members.length)];
      let loserMember = members.find(m => m.id !== winnerMember.id);

      let winnerUser = getUser(winnerMember.id);
      let loserUser = getUser(loserMember.id);

      winnerUser.wins += 1;
      loserUser.loses += 1;
      winnerUser.gems += 5; // battle reward

      save();

      msg.channel.send(`
🏆 **BATTLE RESULT**

Winner: ${winnerMember.user.username}  
Reward: 5 Gems
`);
    }, 5000);
  }

  /* ================= LEADERBOARDS ================= */
  if (cmd === "lb") {
    let type = args[0];
    if (type === "c") {
      // Coins/Gems leaderboard
      let sorted = Object.entries(users)
        .sort((a, b) => (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank))
        .slice(0, 10);

      let text = "🏆 **GLOBAL COINS/GEMS LEADERBOARD**\n\n";
      for (let i = 0; i < sorted.length; i++) {
        let id = sorted[i][0];
        let data = sorted[i][1];
        text += `${i + 1}. <@${id}> — Coins: ${data.wallet + data.bank}, Gems: ${data.gems}\n`;
      }
      msg.channel.send(text);
    }

    if (type === "b") {
      // Battle leaderboard
      let sorted = Object.entries(users)
        .sort((a, b) => b[1].wins - a[1].wins)
        .slice(0, 10);

      let text = "⚔ **GLOBAL BATTLE LEADERBOARD**\n\n";
      for (let i = 0; i < sorted.length; i++) {
        let id = sorted[i][0];
        let data = sorted[i][1];
        text += `${i + 1}. <@${id}> — Wins: ${data.wins}, Loses: ${data.loses}\n`;
      }
      msg.channel.send(text);
    }
  }
});
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  let user = getUser(msg.author.id);

  /* ================= ADMIN / OWNER COMMANDS ================= */
  const OWNER_ID = "fzboy786_01978"; // replace with actual Discord ID if needed
  if (msg.author.id === OWNER_ID) {
    if (cmd === "addcoins") {
      let target = msg.mentions.users.first();
      let amount = parseInt(args[1]);
      if (!target || !amount) return msg.reply("Usage: s addcoins @user amount");

      let targetUser = getUser(target.id);
      targetUser.wallet += amount;
      save();
      msg.reply(`💰 Added ${amount} coins to ${target.username}`);
    }

    if (cmd === "addgems") {
      let target = msg.mentions.users.first();
      let amount = parseInt(args[1]);
      if (!target || !amount) return msg.reply("Usage: s addgems @user amount");

      let targetUser = getUser(target.id);
      targetUser.gems += amount;
      save();
      msg.reply(`💎 Added ${amount} gems to ${target.username}`);
    }

    if (cmd === "resetuser") {
      let target = msg.mentions.users.first();
      if (!target) return msg.reply("Usage: s resetuser @user");
      users[target.id] = undefined;
      save();
      msg.reply(`♻️ Reset ${target.username}'s data`);
    }
  }

  /* ================= DRAGON SHOP ================= */
  if (cmd === "dragons") {
    msg.reply(`
🐉 **DRAGON SHOP**

🔥 Fire Dragon — 5,000,000 Coins  
❄ Ice Dragon — 6,000,000 Coins  
🌪 Wind Dragon — 7,000,000 Coins  
⚡ Lightning Dragon — 8,000,000 Coins  
🌍 Earth Dragon — 10,000,000 Coins  

Buy using: s buy dragon <element>
`);
  }

  /* ================= BUY DRAGON ================= */
  if (cmd === "buy") {
    let type = args[0];
    let name = args[1];

    if (type === "dragon") {
      const dragonPrices = {
        fire: 5000000,
        ice: 6000000,
        wind: 7000000,
        lightning: 8000000,
        earth: 10000000
      };

      if (!dragonPrices[name]) return msg.reply("Invalid dragon name");

      if (user.wallet < dragonPrices[name]) return msg.reply("Not enough coins");

      user.wallet -= dragonPrices[name];
      user.inventory.dragons.push(name.toUpperCase() + "_DRAGON");
      save();

      msg.reply(`🐉 You bought ${name.toUpperCase()}_DRAGON`);
    }
  }

  /* ================= SELECT DRAGON ================= */
  if (cmd === "set") {
    let dragon = args[0].toUpperCase() + "_DRAGON";
    if (!user.inventory.dragons.includes(dragon)) return msg.reply("You don't own this dragon");

    user.dragon = dragon;
    save();
    msg.reply(`🐉 Dragon set to ${dragon}`);
  }

  /* ================= FEED / LEVEL DRAGON ================= */
  if (cmd === "feed") {
    if (!user.dragon) return msg.reply("No dragon selected");
    if (user.gems < 100) return msg.reply("You need 100 gems to feed");

    user.gems -= 100;
    if (!user.dragonsLevel) user.dragonsLevel = {};
    if (!user.dragonsLevel[user.dragon]) user.dragonsLevel[user.dragon] = 1;
    else user.dragonsLevel[user.dragon] += 1;

    save();
    msg.reply(`🐉 ${user.dragon} has leveled up to Level ${user.dragonsLevel[user.dragon]}`);
  }

  /* ================= WEAPONS / ARMOURS SHOP ================= */
  if (cmd === "weapons") {
    msg.reply(`
⚔ **WEAPON SHOP**

🔥 Fire Sword — 1,000,000  
❄ Ice Spear — 1,000,000  
🌪 Wind Katana — 1,000,000  
⚡ Lightning Blade — 1,000,000
`);
  }

  if (cmd === "armours") {
    msg.reply(`
🛡 **ARMOUR SHOP**

🔥 Fire Armour — 500,000  
❄ Ice Armour — 500,000  
🌪 Wind Armour — 500,000  
⚡ Lightning Armour — 500,000
`);
  }
});
client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  let user = getUser(msg.author.id);

  /* ================= SLOT MACHINE ================= */
  if (cmd === "slot") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);
    if (!bet || bet <= 0) return msg.reply("Enter a valid bet");
    if (bet > 200000) bet = 200000;
    if (bet > user.wallet) return msg.reply("Not enough coins");

    user.wallet -= bet;
    save();

    let symbols = ["💎", "🥭", "🍉"];
    let spinningMsg = await msg.reply("🎰 Spinning the slot...");

    // Spin animation
    let spinFrames = 6;
    for (let i = 0; i < spinFrames; i++) {
      let s1 = symbols[Math.floor(Math.random() * symbols.length)];
      let s2 = symbols[Math.floor(Math.random() * symbols.length)];
      let s3 = symbols[Math.floor(Math.random() * symbols.length)];
      await spinningMsg.edit(`🎰 **Spinning...**\n| ${s1} | ${s2} | ${s3} |`);
      await new Promise(r => setTimeout(r, 600));
    }

    // Final result
    let finalS1 = symbols[Math.floor(Math.random() * symbols.length)];
    let finalS2 = symbols[Math.floor(Math.random() * symbols.length)];
    let finalS3 = symbols[Math.floor(Math.random() * symbols.length)];

    let resultText = `🎰 **SLOT RESULT**\n| ${finalS1} | ${finalS2} | ${finalS3} |\n`;
    let reward = 0;

    if (finalS1 === finalS2 && finalS2 === finalS3) {
      if (finalS1 === "💎") reward = bet * 3;
      else if (finalS1 === "🥭") reward = bet * 2;
      else reward = bet;
      user.wallet += reward;
      resultText += `✨ **YOU WON** ${reward} coins!`;
    } else {
      resultText += `💀 **YOU LOST** ${bet} coins!`;
    }

    save();
    spinningMsg.edit(resultText);
  }

  /* ================= LEADERBOARDS ================= */
  if (cmd === "lb") {
    if (args[0] === "c") {
      let sorted = Object.entries(users)
        .sort((a, b) => (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank))
        .slice(0, 10);
      let text = "🏆 **COINS LEADERBOARD**\n\n";
      sorted.forEach((entry, i) => {
        let id = entry[0];
        let data = entry[1];
        text += `${i + 1}. <@${id}> — Wallet: ${data.wallet}, Bank: ${data.bank}, Gems: ${data.gems}\n`;
      });
      msg.channel.send(text);
    }

    if (args[0] === "b") {
      let sorted = Object.entries(users)
        .sort((a, b) => b[1].wins - a[1].wins)
        .slice(0, 10);
      let text = "⚔ **BATTLE LEADERBOARD**\n\n";
      sorted.forEach((entry, i) => {
        let id = entry[0];
        let data = entry[1];
        text += `${i + 1}. <@${id}> — Wins: ${data.wins}, Loses: ${data.loses}\n`;
      });
      msg.channel.send(text);
    }
  }
});

/* ================= SAVE DATABASE ON EXIT ================= */
process.on("exit", () => {
  save();
});
process.on("SIGINT", () => {
  save();
  process.exit();
});
process.on("SIGTERM", () => {
  save();
  process.exit();
});

// ---------- SERVER ADMIN CMDS ----------
if ((cmd === "disable" || cmd === "enable") && msg.member.permissions.has("ADMINISTRATOR")) {
    const channel = msg.mentions.channels.first();
    if (!channel) return msg.reply("Mention a channel to enable/disable the bot.");
    
    // A simple in-memory map to track disabled channels
    if (!global.disabledChannels) global.disabledChannels = [];
    
    if (cmd === "disable") {
        if (!global.disabledChannels.includes(channel.id)) global.disabledChannels.push(channel.id);
        msg.reply(`✅ Bot disabled in ${channel.name}`);
    } else if (cmd === "enable") {
        global.disabledChannels = global.disabledChannels.filter(id => id !== channel.id);
        msg.reply(`✅ Bot enabled in ${channel.name}`);
    }
}

// ---------- BOT OWNER CMDS ----------
const botOwnerId = "fzboy786_01978";

if (msg.author.id === botOwnerId) {

    // Set coins for a user
    if (cmd === "setmoney") {
        let target = msg.mentions.users.first();
        let amount = parseInt(args[1]);
        if (!target || isNaN(amount)) return msg.reply("Usage: s setmoney @user amount");
        const targetUser = getUser(target.id);
        targetUser.wallet = amount;
        save();
        msg.reply(`💰 Set ${target.username}'s wallet to ${amount}`);
    }

    // Set gems for a user
    if (cmd === "setgems") {
        let target = msg.mentions.users.first();
        let amount = parseInt(args[1]);
        if (!target || isNaN(amount)) return msg.reply("Usage: s setgems @user amount");
        const targetUser = getUser(target.id);
        targetUser.gems = amount;
        save();
        msg.reply(`💎 Set ${target.username}'s gems to ${amount}`);
    }

    // Reset all bot data
    if (cmd === "reset") {
        users = {};
        save();
        msg.reply("⚠ Bot data reset successfully.");
    }

    // Admin access management
    if (cmd === "admin" && args[0]) {
        const subcmd = args[0].toLowerCase();
        if (subcmd === "add") {
            let target = msg.mentions.users.first();
            if (!target) return msg.reply("Mention user to add admin.");
            if (!user.admins) user.admins = [];
            if (!user.admins.includes(target.id)) user.admins.push(target.id);
            save();
            msg.reply(`✅ Added <@${target.id}> as bot admin.`);
        }
        if (subcmd === "remove") {
            let target = msg.mentions.users.first();
            if (!target) return msg.reply("Mention user to remove admin.");
            if (!user.admins) user.admins = [];
            user.admins = user.admins.filter(id => id !== target.id);
            save();
            msg.reply(`❌ Removed <@${target.id}> from bot admins.`);
        }
        if (subcmd === "list") {
            msg.reply(`👑 Bot Admins:\n${user.admins ? user.admins.map(id => `<@${id}>`).join("\n") : "No admins set"}`);
        }
    }
}

// ---------- LOGIN ----------
client.login(process.env.TOKEN);
