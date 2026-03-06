const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
 intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
});

const TOKEN = process.env.TOKEN;
const PREFIX = "s";
const OWNER = "fzboy786_01978";

let db = JSON.parse(fs.readFileSync("./database.json"));

function save() {
 fs.writeFileSync("./database.json", JSON.stringify(db, null, 2));
}

function getUser(id) {
 if (!db.users[id]) {
  db.users[id] = {
   coins: 500,
   gems: 10,
   lvl: 1,
   xp: 0,
   dragons: [],
   fights: { win: 0, lose: 0 }
  };
 }
 return db.users[id];
}

const dragons = {
 fire_dragon: { price: 500, emoji: "🔥" },
 ice_dragon: { price: 700, emoji: "❄️" },
 "lightning-dragon": { price: 900, emoji: "⚡" },
 wind_dragon: { price: 600, emoji: "🌪️" }
};

client.on("messageCreate", async msg => {

 if (msg.author.bot) return;
 if (!msg.content.startsWith(PREFIX)) return;

 if (db.disabledChannels.includes(msg.channel.id)) {
  if (!msg.member.permissions.has("Administrator")) return;
 }

 const args = msg.content.slice(1).trim().split(/ +/);
 const cmd = args.shift().toLowerCase();
 const user = getUser(msg.author.id);

 // HELP
 if (cmd === "help") {
  msg.reply(`
📜 **COMMANDS**

s help
s profile
s lvl
s bal
s daily
s give
s cf
s slot
s shop
s buy fire_dragon
s buy ice_dragon
s buy lightning-dragon
s buy wind_dragon
s inv
s challenge @user
s accept
s lb coins
s lb gems
s lb fights
`);
 }

 // PROFILE
 if (cmd === "profile") {

  const embed = new EmbedBuilder()
   .setTitle(`${msg.author.username} Profile`)
   .addFields(
    { name: "Coins", value: `${user.coins}`, inline: true },
    { name: "Gems", value: `${user.gems}`, inline: true },
    { name: "Level", value: `${user.lvl}`, inline: true }
   );

  msg.reply({ embeds: [embed] });

 }

 // BAL
 if (cmd === "bal") {

  msg.reply(`
💰 Coins: ${user.coins}
💎 Gems: ${user.gems}
`);

 }

 // DAILY
 if (cmd === "daily") {

  user.coins += 300;
  save();

  msg.reply("🎁 Daily reward: 300 coins");

 }

 // GIVE
 if (cmd === "give") {

  const member = msg.mentions.users.first();
  const amount = parseInt(args[1]);

  if (!member) return;

  const target = getUser(member.id);

  if (user.coins < amount) return;

  user.coins -= amount;
  target.coins += amount;

  save();

  msg.reply(`💸 Sent ${amount} coins`);

 }

 // COINFLIP
 if (cmd === "cf") {

  const bet = parseInt(args[0]);

  if (user.coins < bet) return msg.reply("Not enough coins");

  if (Math.random() < 0.5) {
   user.coins += bet;
   msg.reply("🪙 You won!");
  } else {
   user.coins -= bet;
   msg.reply("💀 You lost");
  }

  save();

 }

 // SLOT
 if (cmd === "slot") {

  const items = ["🍒","🍉","💎"];

  const a = items[Math.floor(Math.random()*3)];
  const b = items[Math.floor(Math.random()*3)];
  const c = items[Math.floor(Math.random()*3)];

  if (a === b && b === c) {
   user.coins += 500;
  }

  msg.reply(`${a} | ${b} | ${c}`);

  save();

 }

 // SHOP
 if (cmd === "shop") {

  msg.reply(`
🐉 **DRAGON SHOP**

s buy fire_dragon - 500
s buy ice_dragon - 700
s buy lightning-dragon - 900
s buy wind_dragon - 600
`);

 }

 // BUY
 if (cmd === "buy") {

  const name = args[0];

  if (!dragons[name]) return;

  const d = dragons[name];

  if (user.coins < d.price) return msg.reply("Not enough coins");

  user.coins -= d.price;

  user.dragons.push({
   name: name,
   lvl: 1
  });

  save();

  msg.reply(`🐉 Bought ${name}`);

 }

 // INVENTORY
 if (cmd === "inv") {

  let list = user.dragons.map(d => `${d.name} LVL ${d.lvl}`).join("\n");

  msg.reply(`
📦 INVENTORY

DRAGONS
${list || "None"}

WEAPONS
None

ARMOUR
None

GEMS
${user.gems}
`);

 }

 // LEADERBOARD
 if (cmd === "lb") {

  const type = args[0];

  let arr = Object.entries(db.users);

  if (type === "coins") {
   arr.sort((a,b)=>b[1].coins-a[1].coins);
  }

  if (type === "gems") {
   arr.sort((a,b)=>b[1].gems-a[1].gems);
  }

  msg.reply("🏆 Leaderboard loaded");

 }

 // DISABLE
 if (cmd === "disable") {

  if (!msg.member.permissions.has("Administrator")) return;

  db.disabledChannels.push(msg.channel.id);
  save();

  msg.reply("❌ Bot disabled in this channel");

 }

 // ENABLE
 if (cmd === "enable") {

  if (!msg.member.permissions.has("Administrator")) return;

  db.disabledChannels = db.disabledChannels.filter(id=>id!==msg.channel.id);
  save();

  msg.reply("✅ Bot enabled");

 }

 // OWNER CMDS
 if (msg.author.username === OWNER) {

  if (cmd === "setmoney") {

   const member = msg.mentions.users.first();
   const amount = parseInt(args[1]);

   const target = getUser(member.id);

   target.coins = amount;

   save();

   msg.reply("Money set");

  }

  if (cmd === "setgems") {

   const member = msg.mentions.users.first();
   const amount = parseInt(args[1]);

   const target = getUser(member.id);

   target.gems = amount;

   save();

   msg.reply("Gems set");

  }

 }

});

client.login(TOKEN);
