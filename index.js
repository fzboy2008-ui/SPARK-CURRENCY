/* ================= IMPORTS ================= */
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');

/* ================= CLIENT SETUP ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
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
      dragonLevel: {},
      weapon: null,
      armour: null,
      inventory: {
        dragons: [],
        weapons: [],
        armours: []
      },
      lastDaily: 0,
      wins: 0,
      loses: 0,
      admins: []
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
  const user = getUser(msg.author.id);

  // 1 XP per message
  user.xp += 1;
  let needed = 2500;

  if (user.xp >= needed) {
    user.xp -= needed;
    user.rank += 1;
    user.wallet += 5000;
    user.gems += 5;

    msg.channel.send(`
┏━━━━━━━━━━━━━━━━━━┓
┃ 🏆 **RANK UP!** 
┃ ${msg.author.username} reached Rank **${user.rank}** 
┃ 💰 Coins: +5000  💎 Gems: +5 
┗━━━━━━━━━━━━━━━━━━┛
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
  const user = getUser(msg.author.id);

  /* ================= HELP ================= */
  if (cmd === "help") {
    msg.reply(`
┏━━━━━━━━━━━━━━━━━━┓
┃ ⚡ **SPARK BOT COMMANDS** 
┃ 💰 Economy 
┃ s bal │ s deposit │ s withdraw │ s give 
┃ 🎁 Rewards 
┃ s daily 
┃ 👤 Profile 
┃ s profile │ s rank │ s inv 
┃ 🎮 Games 
┃ s cf │ s slot 
┃ ⚔ Battle 
┃ s challenge │ s accept 
┃ 🏆 Leaderboard 
┃ s lb c │ s lb b 
┗━━━━━━━━━━━━━━━━━━┛
`);
  }

  /* ================= BALANCE ================= */
  if (cmd === "bal") {
    msg.reply(`
┏━━━━━━━━━━━━━━━━━━┓
┃ 💵 **${msg.author.username} Balance** 
┃ 👜 Wallet: ${user.wallet} 
┃ 🏦 Bank: ${user.bank} 
┃ 💎 Gems: ${user.gems} 
┗━━━━━━━━━━━━━━━━━━┛
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
    msg.reply(`💸 Sent ${amount} coins to <@${target.id}>`);
  }

  /* ================= DAILY ================= */
  if (cmd === "daily") {
    let now = Date.now();
    if (now - user.lastDaily < 86400000) return msg.reply("⏳ Already claimed today!");

    user.wallet += 500;
    user.lastDaily = now;

    save();
    msg.reply(`
🎁 **DAILY REWARD**
💰 Coins: 500
`);
  }

  /* ================= PROFILE ================= */
  if (cmd === "profile") {
    msg.reply(`
┏━━━━━━━━━━━━━━━━━━┓
┃ 👤 **PROFILE** 
┃ Name: ${msg.author.username} 
┃ Rank: ${user.rank} 
┃ XP: ${user.xp}/2500 
┃ 🐉 Dragon: ${user.dragon || "None"} 
┃ ⚔ Weapon: ${user.weapon || "None"} 
┃ 🛡 Armour: ${user.armour || "None"} 
┃ Wins: ${user.wins} 
┃ Loses: ${user.loses} 
┗━━━━━━━━━━━━━━━━━━┛
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

  /* ================= DRAGON SHOP ================= */
  const DRAGONS = {
    FIRE: { price: 5000000, name: "Pyro Scale" },
    ICE: { price: 6000000, name: "Frost Wing" },
    WIND: { price: 7000000, name: "Gale Talon" },
    LIGHTNING: { price: 8000000, name: "Volt Fang" },
    EARTH: { price: 10000000, name: "Terra Claw" }
  };

  if (cmd === "dragons") {
    let shopText = "🐉 **DRAGON SHOP**\n";
    for (let d in DRAGONS) {
      shopText += `🔥 ${DRAGONS[d].name} (${d}) — ${DRAGONS[d].price} coins\n`;
    }
    shopText += "Buy using: s buy dragon <ELEMENT>";
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
      msg.reply(`🐉 Bought ${DRAGONS[name].name}`);
    }
  }

  if (cmd === "set") {
    let type = args[0];
    let item = args[1]?.toUpperCase();
    if (type === "dragon") {
      if (!user.inventory.dragons.includes(item)) return msg.reply("You don't own this dragon");
      user.dragon = item;
      save();
      msg.reply(`🐉 Dragon set to ${item}`);
    }
    if (type === "weapon") {
      if (!user.inventory.weapons.includes(item)) return msg.reply("You don't own this weapon");
      user.weapon = item;
      save();
      msg.reply(`⚔ Weapon set to ${item}`);
    }
    if (type === "armour") {
      if (!user.inventory.armours.includes(item)) return msg.reply("You don't own this armour");
      user.armour = item;
      save();
      msg.reply(`🛡 Armour set to ${item}`);
    }
  }

  if (cmd === "feed") {
    if (!user.dragon) return msg.reply("No dragon selected");
    if (user.gems < 100) return msg.reply("Need 100 gems to feed dragon");

    user.gems -= 100;
    if (!user.dragonLevel) user.dragonLevel = {};
    if (!user.dragonLevel[user.dragon]) user.dragonLevel[user.dragon] = 1;
    else user.dragonLevel[user.dragon] += 1;

    save();
    msg.reply(`🐉 ${user.dragon} leveled up to Level ${user.dragonLevel[user.dragon]}`);
  }

  /* ================= SLOT MACHINE ================= */
  if (cmd === "slot") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);

    if (!bet || bet <= 0) return msg.reply("Enter valid bet");
    if (bet > user.wallet) return msg.reply("Not enough coins");

    const symbols = ["💎","🥭","🍉"];
    let spinMsg = await msg.reply("🎰 **Spinning slot...**");
    let s1,s2,s3;

    for(let i=0;i<6;i++){
      s1=symbols[Math.floor(Math.random()*3)];
      s2=symbols[Math.floor(Math.random()*3)];
      s3=symbols[Math.floor(Math.random()*3)];
      await spinMsg.edit(`🎰 | ${s1} | ${s2} | ${s3} |`);
      await new Promise(r=>setTimeout(r,400));
    }

    s1=symbols[Math.floor(Math.random()*3)];
    s2=symbols[Math.floor(Math.random()*3)];
    s3=symbols[Math.floor(Math.random()*3)];
    let reward=0;
    let result=`🎰 **SLOT RESULT**\n| ${s1} | ${s2} | ${s3} |\n`;

    if(s1===s2 && s2===s3){
      if(s1==="💎") reward=bet*3;
      else if(s1==="🥭") reward=bet*2;
      else reward=bet;
      user.wallet+=reward;
      result+=`✨ **YOU WON** ${reward} coins!`;
    }else{
      user.wallet-=bet;
      result+=`💀 **YOU LOST** ${bet} coins!`;
    }

    save();
    spinMsg.edit(result);
  }

  /* ================= LEADERBOARDS ================= */
  if(cmd==="lb"){
    if(args[0]==="c"){
      let sorted=Object.entries(users).sort((a,b)=>(b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank)).slice(0,10);
      let text="🏆 **COINS/GEMS LEADERBOARD**\n";
      sorted.forEach((e,i)=>{
        text+=`${i+1}. <@${e[0]}> — 👜 Wallet: ${e[1].wallet} 🏦 Bank: ${e[1].bank} 💎 Gems: ${e[1].gems}\n`;
      });
      msg.channel.send(text);
    }
    if(args[0]==="b"){
      let sorted=Object.entries(users).sort((a,b)=>b[1].wins-a[1].wins).slice(0,10);
      let text="⚔ **BATTLE LEADERBOARD**\n";
      sorted.forEach((e,i)=>{
        text+=`${i+1}. <@${e[0]}> — Wins: ${e[1].wins} Loses: ${e[1].loses}\n`;
      });
      msg.channel.send(text);
    }
  }

  /* ================= BATTLE SYSTEM ================= */
  if(cmd==="challenge"){
    let opponent=msg.mentions.users.first();
    if(!opponent) return msg.reply("Mention a user to challenge");
    msg.channel.send(`⚔ **BATTLE CHALLENGE**\n${msg.author.username} challenged ${opponent.username}!\nType s accept to accept!`);
  }

  if(cmd==="accept"){
    msg.channel.send("⚔ Battle starting...");
    setTimeout(()=>{
      let members=[...msg.guild.members.cache.values()].filter(m=>!m.user.bot);
      let winner=members[Math.floor(Math.random()*members.length)];
      let loser=members.find(m=>m.id!==winner.id);
      let winnerUser=getUser(winner.id);
      let loserUser=getUser(loser.id);

      winnerUser.wins+=1;
      loserUser.loses+=1;
      winnerUser.gems+=5;

      save();

      msg.channel.send(`🏆 **BATTLE RESULT**\nWinner: ${winner.user.username}\nReward: 5 Gems`);
    },5000);
  }

  /* ================= ADMIN / OWNER COMMANDS ================= */
  const OWNER_ID="fzboy786_01978";
  if(msg.author.id===OWNER_ID){
    if(cmd==="addcoins"){
      let target=msg.mentions.users.first();
      let amount=parseInt(args[1]);
      if(!target || !amount) return msg.reply("Usage: s addcoins @user amount");
      let t=getUser(target.id); t.wallet+=amount; save();
      msg.reply(`💰 Added ${amount} coins to ${target.username}`);
    }
    if(cmd==="addgems"){
      let target=msg.mentions.users.first();
      let amount=parseInt(args[1]);
      if(!target || !amount) return msg.reply("Usage: s addgems @user amount");
      let t=getUser(target.id); t.gems+=amount; save();
      msg.reply(`💎 Added ${amount} gems to ${target.username}`);
    }
    if(cmd==="resetuser"){
      let target=msg.mentions.users.first();
      if(!target) return msg.reply("Usage: s resetuser @user");
      users[target.id]=undefined; save();
      msg.reply(`♻️ Reset ${target.username}'s data`);
    }
  }

});
/* ================= SAVE DATABASE ON EXIT ================= */
process.on("exit",()=>save());
process.on("SIGINT",()=>{save(); process.exit();});
process.on("SIGTERM",()=>{save(); process.exit();});

/* ================= BOT LOGIN ================= */
client.login(process.env.TOKEN);
