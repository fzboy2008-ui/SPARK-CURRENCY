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
      dragonLevel: 0,
      armour: null,
      weapon: null,
      inventory: { dragons: [], armours: [], weapons: [] },
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
client.on("messageCreate", async (msg) => {
  if(msg.author.bot) return;
  const user = getUser(msg.author.id);

  user.xp += 1; // 1 XP per message
  const neededXP = 2500;

  if(user.xp >= neededXP) {
    user.xp -= neededXP;
    user.rank += 1;
    user.wallet += 5000;
    user.gems += 5;

    msg.channel.send(`
════════════════════════
🏆 **RANK UP!** 🏆
${msg.author.username} reached **Rank ${user.rank}**
💰 Wallet: ${user.wallet} 💎 Gems: ${user.gems}
════════════════════════
`);
  }

  save();
});

/* ================= COMMAND HANDLER ================= */
client.on("messageCreate", async (msg) => {
  if(msg.author.bot) return;
  if(!msg.content.startsWith(prefix)) return;

  const args = msg.content.slice(prefix.length).trim().split(/ +/);
  const cmd = args.shift().toLowerCase();
  const user = getUser(msg.author.id);

  /* ================= HELP ================= */
  if(cmd === "help") {
    msg.reply(`
════════════════════════
⚡ **SPARK BOT COMMANDS** ⚡
💰 Economy:
s bal | s deposit | s withdraw | s give

🎁 Rewards:
s daily

👤 Profile:
s profile | s rank | s inv

🎮 Games:
s cf | s slot

⚔ Battle:
s challenge | s accept

🏆 Leaderboards:
s lb c | s lb b
════════════════════════
`);
  }

  /* ================= BALANCE ================= */
  if(cmd === "bal") {
    let target = msg.mentions.users.first() || msg.author;
    let targetUser = getUser(target.id);
    msg.reply(`
════════════════════════
💸 **${target.username}'s BALANCE**
💰 Wallet: ${targetUser.wallet}
🏦 Bank: ${targetUser.bank}
💎 Gems: ${targetUser.gems}
════════════════════════
`);
  }

  /* ================= DEPOSIT ================= */
  if(cmd === "deposit") {
    let amount = args[0];
    if(amount === "all") amount = user.wallet;
    amount = parseInt(amount);

    if(!amount || amount <= 0) return msg.reply("Enter a valid amount!");
    if(amount > user.wallet) return msg.reply("Not enough wallet coins!");

    user.wallet -= amount;
    user.bank += amount;
    save();
    msg.reply(`🏦 Deposited ${amount} coins!`);
  }

  /* ================= WITHDRAW ================= */
  if(cmd === "withdraw") {
    let amount = args[0];
    if(amount === "all") amount = user.bank;
    amount = parseInt(amount);

    if(!amount || amount <= 0) return msg.reply("Enter a valid amount!");
    if(amount > user.bank) return msg.reply("Not enough bank coins!");

    user.bank -= amount;
    user.wallet += amount;
    save();
    msg.reply(`💰 Withdrawn ${amount} coins!`);
  }

  /* ================= GIVE ================= */
  if(cmd === "give") {
    let target = msg.mentions.users.first();
    let amount = parseInt(args[1]);

    if(!target) return msg.reply("Mention a user to give coins!");
    if(!amount || amount <= 0) return msg.reply("Enter a valid amount!");
    if(amount > user.wallet) return msg.reply("Not enough coins!");

    let targetUser = getUser(target.id);
    user.wallet -= amount;
    targetUser.wallet += amount;
    save();

    msg.reply(`💸 Sent ${amount} coins to ${target.username}`);
  }

  /* ================= DAILY ================= */
  if(cmd === "daily") {
    const now = Date.now();
    if(now - user.lastDaily < 86400000) return msg.reply("⏳ You already claimed your daily reward!");

    user.wallet += 500;
    user.lastDaily = now;
    save();

    msg.reply(`
════════════════════════
🎁 **DAILY REWARD**
💰 Coins: 500
════════════════════════
`);
  }

  /* ================= PROFILE ================= */
  if(cmd === "profile") {
    msg.reply(`
════════════════════════
👤 **PROFILE**
Name: ${msg.author.username}
🏅 Rank: ${user.rank}
XP: ${user.xp}/2500
🐉 Dragon: ${user.dragon || "None"} (Lvl: ${user.dragonLevel})
🛡 Armour: ${user.armour || "None"}
⚔ Weapon: ${user.weapon || "None"}
⚔ Wins: ${user.wins} 💀 Loses: ${user.loses}
════════════════════════
`);
  }

  /* ================= RANK ================= */
  if(cmd === "rank") {
    msg.reply(`
════════════════════════
🏅 **RANK INFO**
Rank: ${user.rank}
XP: ${user.xp}/2500
════════════════════════
`);
  }

  /* ================= INVENTORY ================= */
  if(cmd === "inv") {
    msg.reply(`
════════════════════════
🎒 **INVENTORY**
🐉 Dragons: ${user.inventory.dragons.join(", ") || "None"}
⚔ Weapons: ${user.inventory.weapons.join(", ") || "None"}
🛡 Armours: ${user.inventory.armours.join(", ") || "None"}
════════════════════════
`);
  }

  /* ================= DRAGON SHOP ================= */
  const DRAGONS = {
    PYROMA: 5000000,
    CRYOVEX: 6000000,
    AEROLIS: 7000000,
    THUNDERION: 8000000,
    TERRAGON: 10000000
  };

  if(cmd === "dragons") {
    let shopText = "🐉 **DRAGON SHOP**\n";
    for(let d in DRAGONS) shopText += `🔥 ${d} — ${DRAGONS[d]} coins\n`;
    shopText += "\nBuy using: s buy dragon <dragon_name>";
    msg.reply(shopText);
  }

  if(cmd === "buy") {
    let type = args[0];
    let name = args[1]?.toUpperCase();
    if(type === "dragon") {
      if(!DRAGONS[name]) return msg.reply("Dragon not found!");
      if(user.inventory.dragons.includes(name)) return msg.reply("You already own this dragon!");
      if(user.wallet < DRAGONS[name]) return msg.reply("Not enough coins!");

      user.wallet -= DRAGONS[name];
      user.inventory.dragons.push(name);
      save();
      msg.reply(`🐉 Bought ${name}!`);
    }
  }

  if(cmd === "set") {
    let dragon = args[0]?.toUpperCase();
    if(user.inventory.dragons.includes(dragon)) {
      user.dragon = dragon;
      save();
      msg.reply(`🐉 Dragon set to ${dragon}`);
    } else if(user.inventory.armours.includes(dragon)) {
      user.armour = dragon;
      save();
      msg.reply(`🛡 Armour set to ${dragon}`);
    } else if(user.inventory.weapons.includes(dragon)) {
      user.weapon = dragon;
      save();
      msg.reply(`⚔ Weapon set to ${dragon}`);
    } else {
      msg.reply("You don't own this item!");
    }
  }

  /* ================= SLOT MACHINE ================= */
  if(cmd === "slot") {
    let bet = args[0];
    if(bet === "all") bet = user.wallet;
    bet = parseInt(bet);
    if(!bet || bet <= 0) return msg.reply("Enter a valid bet!");
    if(bet > 200000) bet = 200000;
    if(bet > user.wallet) return msg.reply("Not enough coins!");

    user.wallet -= bet;
    save();

    const symbols = ["💎", "🥭", "🍉"];
    let s1 = symbols[Math.floor(Math.random() * symbols.length)];
    let s2 = symbols[Math.floor(Math.random() * symbols.length)];
    let s3 = symbols[Math.floor(Math.random() * symbols.length)];
    let reward = 0;
    let resultText = `🎰 **SLOT RESULT**\n| ${s1} | ${s2} | ${s3} |\n`;

    if(s1 === s2 && s2 === s3){
      reward = s1 === "💎" ? bet*3 : s1 === "🥭" ? bet*2 : bet;
      user.wallet += reward;
      resultText += `✨ YOU WON: ${reward} coins!`;
    } else {
      resultText += `💀 YOU LOST: ${bet} coins!`;
    }
    save();
    msg.reply(resultText);
  }

  /* ================= COINFLIP ================= */
  if(cmd === "cf" || cmd === "coinflip") {
    let bet = args[0];
    if(bet === "all") bet = user.wallet;
    bet = parseInt(bet);
    if(!bet || bet <= 0) return msg.reply("Enter a valid bet!");
    if(bet > 200000) bet = 200000;
    if(bet > user.wallet) return msg.reply("Not enough coins!");

    msg.reply("🪙 Flipping the coin...");

    setTimeout(() => {
      let win = Math.random() < 0.2;
      if(win){
        user.wallet += bet;
        msg.channel.send(`🪙 YOU WON! +${bet} coins`);
      } else {
        user.wallet -= bet;
        msg.channel.send(`🪙 YOU LOST! -${bet} coins`);
      }
      save();
    }, 3000);
  }

  /* ================= LEADERBOARDS ================= */
  if(cmd === "lb") {
    let type = args[0];
    if(type === "c"){
      let sorted = Object.entries(users).sort((a,b)=> (b[1].wallet+b[1].bank) - (a[1].wallet+a[1].bank)).slice(0,10);
      let text = "🏆 **COINS LEADERBOARD**\n";
      sorted.forEach((entry,i)=>{
        text += `${i+1}. <@${entry[0]}> — Wallet: ${entry[1].wallet}, Bank: ${entry[1].bank}, Gems: ${entry[1].gems}\n`;
      });
      msg.reply(text);
    }
    if(type === "b"){
      let sorted = Object.entries(users).sort((a,b)=> b[1].wins - a[1].wins).slice(0,10);
      let text = "⚔ **BATTLE LEADERBOARD**\n";
      sorted.forEach((entry,i)=>{
        text += `${i+1}. <@${entry[0]}> — Wins: ${entry[1].wins}, Loses: ${entry[1].loses}\n`;
      });
      msg.reply(text);
    }
  }

  /* ================= BATTLE SYSTEM ================= */
  if(cmd === "challenge") {
    let opponent = msg.mentions.users.first();
    if(!opponent) return msg.reply("Mention a user to challenge!");

    msg.channel.send(`⚔ **BATTLE CHALLENGE**\n${msg.author.username} challenged ${opponent.username}!\nType s accept to accept the battle.`);
  }

  if(cmd === "accept") {
    msg.channel.send("⚔ Battle starting...");

    setTimeout(()=>{
      let members = [...msg.channel.members.values()].filter(m => !m.user.bot);
      let winnerMember = members[Math.floor(Math.random() * members.length)];
      let loserMember = members.find(m => m.id !== winnerMember.id);

      let winnerUser = getUser(winnerMember.id);
      let loserUser = getUser(loserMember.id);

      winnerUser.wins += 1;
      loserUser.loses += 1;
      winnerUser.gems += 5;

      save();
      msg.channel.send(`🏆 **BATTLE RESULT**\nWinner: ${winnerMember.user.username}\nReward: 5 Gems`);
    }, 5000);
  }
});

/* ================= SAVE DATABASE ON EXIT ================= */
process.on("exit",()=>save());
process.on("SIGINT",()=>{save();process.exit();});
process.on("SIGTERM",()=>{save();process.exit();});

/* ================= LOGIN ================= */
client.login(process.env.TOKEN);
