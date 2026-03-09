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

const PREFIXES = ["s","spark"];
const MAX_BET = 100000;

// ================= PREFIX =================

function getPrefix(message){

  const msg = message.content.toLowerCase();

  for(const p of PREFIXES){
    if(msg.startsWith(p + " ")) return p;
  }

}

// ================= DATABASE =================

if(!fs.existsSync("./database")) fs.mkdirSync("./database");

if(!fs.existsSync("./database/users.json"))
fs.writeFileSync("./database/users.json","{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function save(){
fs.writeFileSync("./database/users.json",JSON.stringify(users,null,2));
}

function getUser(id){

if(!users[id]){

users[id] = {
wallet:0,
bank:0,
gems:0,
xp:0,
level:0,
lastDaily:0
};

}

return users[id];

}

// ================= RANK =================

function getRank(level){

if(level >= 41) return "👑 Mythic";
if(level >= 31) return "💎 Diamond";
if(level >= 21) return "🥇 Gold";
if(level >= 11) return "🥈 Silver";
return "🥉 Bronze";

}

// ================= XP BAR =================

function xpBar(xp,level){

const required = (level+1)*2500;

const percent = xp/required;

const filled = Math.floor(percent*10);

return "█".repeat(filled)+"░".repeat(10-filled);

}

// ================= READY =================

client.once("ready",()=>{
console.log("⚡ Spark Bot Online: "+client.user.tag);
});

// ================= MESSAGE =================

client.on("messageCreate", async message=>{

if(message.author.bot) return;

const prefix = getPrefix(message);

if(!prefix) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);

const cmd = args.shift().toLowerCase();

const user = getUser(message.author.id);

// ================= XP SYSTEM =================

user.xp += 1;

const required = (user.level+1)*2500;

if(user.xp >= required && user.level < 50){

user.level++;

const reward = user.level*5000;

user.wallet += reward;

const oldRank = getRank(user.level-1);
const newRank = getRank(user.level);

const embed = new EmbedBuilder()
.setColor("Green")
.setTitle("⭐ LEVEL UP")
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

${message.author.username}

⬆ Level
${user.level-1} → ${user.level}

💰 Reward
+${reward} Coins

━━━━━━━━━━━━━━━━━━━━━━`);

message.channel.send({embeds:[embed]});

if(oldRank !== newRank){

user.gems += 100;

const rankEmbed = new EmbedBuilder()
.setColor("Purple")
.setTitle("👑 RANK UP")
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

${message.author.username}

${newRank} Rank Unlocked

💎 Reward
+100 Gems

━━━━━━━━━━━━━━━━━━━━━━`);

message.channel.send({embeds:[rankEmbed]});

}

save();

}

// ================= HELP =================

if(cmd==="help"){

const embed = new EmbedBuilder()
.setColor("Blue")
.setTitle("⚡ SPARK BOT COMMANDS")
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

💰 ECONOMY
s daily
s bal
s deposit <amount>
s withdraw <amount>

🎰 CASINO
s cf <amount/all>
s slot <amount/all>

👤 PLAYER
s profile
s rank

━━━━━━━━━━━━━━━━━━━━━━`);

return message.reply({embeds:[embed]});

}

// ================= BAL =================

if(cmd==="bal"||cmd==="balance"){

const embed = new EmbedBuilder()
.setColor("Gold")
.setTitle("💰 SPARK BALANCE")
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

👤 ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

━━━━━━━━━━━━━━━━━━━━━━`);

return message.reply({embeds:[embed]});

}

// ================= DAILY =================

if(cmd==="daily"){

const now = Date.now();

const cooldown = 86400000;

if(now-user.lastDaily < cooldown){

const remaining = cooldown-(now-user.lastDaily);

const h = Math.floor(remaining/3600000);
const m = Math.floor((remaining%3600000)/60000);
const s = Math.floor((remaining%60000)/1000);

const embed = new EmbedBuilder()
.setColor("Red")
.setTitle("⏳ DAILY COOLDOWN")
.setDescription(`Next Daily In

${h}h ${m}m ${s}s`);

return message.reply({embeds:[embed]});

}

user.wallet += 1000;
user.lastDaily = now;

save();

const embed = new EmbedBuilder()
.setColor("Green")
.setTitle("🎁 DAILY REWARD")
.setDescription(`💰 Reward : 1000 Coins

💵 Wallet : ${user.wallet}`);

return message.reply({embeds:[embed]});

}

// ================= PROFILE =================

if(cmd==="profile"){

const rank = getRank(user.level);

const bar = xpBar(user.xp,user.level);

const embed = new EmbedBuilder()
.setColor("Blue")
.setTitle("👤 PLAYER PROFILE")
.setThumbnail(message.author.displayAvatarURL())
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

User : ${message.author.username}

🏆 Rank  : ${rank}
⭐ Level : ${user.level}

⚡ XP
${bar}

━━━━━━━━━━━━━━━━━━━━━━

💰 ECONOMY

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

━━━━━━━━━━━━━━━━━━━━━━`);

return message.reply({embeds:[embed]});

}

// ================= RANK =================

if(cmd==="rank"){

const rank = getRank(user.level);

const bar = xpBar(user.xp,user.level);

const embed = new EmbedBuilder()
.setColor("Gold")
.setTitle("🏆 SPARK RANK")
.setThumbnail(message.author.displayAvatarURL())
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

User : ${message.author.username}

👑 Rank  : ${rank}
⭐ Level : ${user.level}

⚡ XP Progress
${bar}

━━━━━━━━━━━━━━━━━━━━━━

🥉 Bronze
🥈 Silver
🥇 Gold
💎 Diamond
👑 Mythic

━━━━━━━━━━━━━━━━━━━━━━`);

return message.reply({embeds:[embed]});

}

// ================= DEPOSIT =================

if(cmd==="deposit"){

const amount = parseInt(args[0]);

if(!amount || amount<=0)
return message.reply("Enter valid amount");

if(user.wallet < amount)
return message.reply("Not enough coins");

user.wallet -= amount;
user.bank += amount;

save();

return message.reply(`Deposited ${amount}`);

}

// ================= WITHDRAW =================

if(cmd==="withdraw"){

const amount = parseInt(args[0]);

if(!amount || amount<=0)
return message.reply("Enter valid amount");

if(user.bank < amount)
return message.reply("Not enough bank coins");

user.bank -= amount;
user.wallet += amount;

save();

return message.reply(`Withdrawn ${amount}`);

}

// ================= COINFLIP =================

if(cmd==="cf"){

let amount = args[0];

if(!amount) return message.reply("Enter bet amount");

let bet;

if(amount==="all") bet = Math.min(user.wallet,MAX_BET);
else bet = parseInt(amount);

if(user.wallet < bet)
return message.reply("Not enough coins");

user.wallet -= bet;

const msg = await message.reply("🪙 Flipping...");

await new Promise(r=>setTimeout(r,800));

if(Math.random()<0.25){

const win = bet*2;

user.wallet += win;

save();

msg.edit(`🪙 You Won ${win}`);

}else{

save();

msg.edit(`💀 You Lost ${bet}`);

}

}

// ================= SLOT =================

if(cmd==="slot"){

let amount = args[0];

if(!amount) return message.reply("Enter bet");

let bet;

if(amount==="all") bet = Math.min(user.wallet,MAX_BET);
else bet = parseInt(amount);

if(user.wallet < bet)
return message.reply("Not enough coins");

user.wallet -= bet;

const slots=["💎","🥭","🍒","🍉"];

const msg = await message.reply("🎰 Spinning...");

let roll;

for(let i=0;i<3;i++){

roll=[
slots[Math.floor(Math.random()*slots.length)],
slots[Math.floor(Math.random()*slots.length)],
slots[Math.floor(Math.random()*slots.length)]
];

await new Promise(r=>setTimeout(r,700));

await msg.edit(`🎰 ${roll.join(" ")}`);

}

const win=Math.random()<0.5;

if(!win){

save();

return msg.edit(`🎰 ${roll.join(" ")}\n\n💀 You Lost ${bet}`);

}

const symbol=slots[Math.floor(Math.random()*slots.length)];

roll=[symbol,symbol,symbol];

let multiplier=1;

if(symbol==="💎") multiplier=3;
else if(symbol==="🥭") multiplier=2;
else if(symbol==="🍒") multiplier=2;
else if(symbol==="🍉") multiplier=1;

const winnings=bet*multiplier;

user.wallet += winnings;

save();

msg.edit(`🎰 ${roll.join(" ")}

💰 Multiplier ${multiplier}x
🏆 Won ${winnings}`);

}

});

client.login(process.env.TOKEN);
