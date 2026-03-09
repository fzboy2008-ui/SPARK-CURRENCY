const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

const client = new Client({
intents:[
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
if(msg.startsWith(p+" ")) return p;
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
inventory:[],
lastDaily:0,
lastWork:0,
lastCrime:0,
lastRob:0
};

}

return users[id];

}

// ================= RANK =================

function getRank(level){

if(level>=41) return "👑 Mythic";
if(level>=31) return "💎 Diamond";
if(level>=21) return "🥇 Gold";
if(level>=11) return "🥈 Silver";
return "🥉 Bronze";

}

// ================= XP BAR =================

function xpBar(xp,level){

const required = (level+1)*2500;

const percent = Math.floor((xp/required)*100);

const filled = Math.floor(percent/10);

const bar = "█".repeat(filled)+"░".repeat(10-filled);

return `${bar} ${percent}%`;

}

// ================= READY =================

client.once("ready",()=>{
console.log("⚡ Spark Bot V6 Online: "+client.user.tag);
});

// ================= MESSAGE =================

client.on("messageCreate",async message=>{

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

const lvlEmbed = new EmbedBuilder()
.setColor("Green")
.setTitle("⭐ LEVEL UP")
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

${message.author.username}

${user.level-1} → ${user.level}

💰 Reward
+${reward} Coins

━━━━━━━━━━━━━━━━━━━━━━`);

message.channel.send({embeds:[lvlEmbed]});

if(oldRank !== newRank){

user.gems += 100;

const rankEmbed = new EmbedBuilder()
.setColor("Purple")
.setTitle("👑 RANK UP")
.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

${message.author.username}

${newRank} Rank Unlocked

💎 +100 Gems

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
s bal
s daily
s deposit <amount>
s withdraw <amount>
s pay <user> <amount>

🎰 CASINO
s cf <amount/all>
s slot <amount/all>

💼 JOBS
s work
s crime
s rob <user>

🛒 SHOP
s shop
s buy <item>
s inventory

👤 PLAYER
s profile
s rank
s leaderboard

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

if(now - user.lastDaily < cooldown){

const time = cooldown - (now-user.lastDaily);

const hours = Math.floor(time/3600000);

return message.reply(`⏳ Daily already claimed\nCome back in ${hours}h`);

}

const reward = 5000 + Math.floor(Math.random()*5000);

user.wallet += reward;

user.lastDaily = now;

save();

const embed = new EmbedBuilder()

.setColor("Green")

.setTitle("🎁 DAILY REWARD")

.setDescription(`━━━━━━━━━━━━━━━━━━━━━━

💰 +${reward} Coins

Come back tomorrow!

━━━━━━━━━━━━━━━━━━━━━━`);

return message.reply({embeds:[embed]});

}

// ================= DEPOSIT =================

if(cmd==="deposit"){

let amount = args[0];

if(!amount) return message.reply("Enter amount");

if(amount==="all") amount = user.wallet;

amount = parseInt(amount);

if(isNaN(amount) || amount<=0)
return message.reply("Invalid amount");

if(user.wallet < amount)
return message.reply("Not enough wallet coins");

user.wallet -= amount;

user.bank += amount;

save();

return message.reply(`🏦 Deposited ${amount} coins`);

}

// ================= WITHDRAW =================

if(cmd==="withdraw"){

let amount = args[0];

if(!amount) return message.reply("Enter amount");

if(amount==="all") amount = user.bank;

amount = parseInt(amount);

if(isNaN(amount) || amount<=0)
return message.reply("Invalid amount");

if(user.bank < amount)
return message.reply("Not enough bank coins");

user.bank -= amount;

user.wallet += amount;

save();

return message.reply(`💵 Withdrawn ${amount} coins`);

}

// ================= COINFLIP =================

if(cmd==="cf"||cmd==="coinflip"){

let amount = args[0];

if(!amount) return message.reply("Enter bet amount");

if(amount==="all") amount = user.wallet;

amount = parseInt(amount);

if(isNaN(amount) || amount<=0)
return message.reply("Invalid bet");

if(amount > MAX_BET)
return message.reply(`Max bet is ${MAX_BET}`);

if(user.wallet < amount)
return message.reply("Not enough coins");

user.wallet -= amount;

const win = Math.random() < 0.25;

if(win){

const reward = amount*2;

user.wallet += reward;

save();

return message.reply(`🪙 Coinflip WIN\n+${reward} coins`);

}else{

save();

return message.reply(`💀 Coinflip LOST\n-${amount} coins`);

}

}

// ================= SLOT =================

if(cmd==="slot"){

let amount = args[0];

if(!amount) return message.reply("Enter bet");

if(amount==="all") amount = user.wallet;

amount = parseInt(amount);

if(isNaN(amount)||amount<=0)
return message.reply("Invalid bet");

if(amount > MAX_BET)
return message.reply(`Max bet ${MAX_BET}`);

if(user.wallet < amount)
return message.reply("Not enough coins");

user.wallet -= amount;

const symbols = ["💎","🥭","🍒","🍉"];

const a = symbols[Math.floor(Math.random()*symbols.length)];

const b = symbols[Math.floor(Math.random()*symbols.length)];

const c = symbols[Math.floor(Math.random()*symbols.length)];

let multiplier = 0;

if(a===b && b===c){

if(a==="💎") multiplier=3;

else if(a==="🥭") multiplier=2;

else if(a==="🍒") multiplier=2;

else if(a==="🍉") multiplier=1;

}

if(multiplier>0){

const win = amount*multiplier;

user.wallet += win;

save();

return message.reply(`🎰 ${a} | ${b} | ${c}\nWIN +${win}`);

}else{

save();

return message.reply(`🎰 ${a} | ${b} | ${c}\nLOSE -${amount}`);

}

}
// ================= WORK =================

if(cmd==="work"){

const now = Date.now();

const cooldown = 3600000;

if(now - user.lastWork < cooldown){

const time = cooldown - (now-user.lastWork);

const mins = Math.floor(time/60000);

return message.reply(`⏳ You are tired\nTry again in ${mins}m`);

}

const reward = 1000 + Math.floor(Math.random()*2000);

user.wallet += reward;

user.lastWork = now;

save();

return message.reply(`💼 You worked and earned ${reward} coins`);

}

// ================= CRIME =================

if(cmd==="crime"){

const now = Date.now();

const cooldown = 7200000;

if(now - user.lastCrime < cooldown){

const time = cooldown - (now-user.lastCrime);

const mins = Math.floor(time/60000);

return message.reply(`🚔 Lay low\nTry again in ${mins}m`);

}

const success = Math.random() < 0.5;

if(success){

const reward = 2000 + Math.floor(Math.random()*4000);

user.wallet += reward;

user.lastCrime = now;

save();

return message.reply(`🔫 Crime success\n+${reward} coins`);

}else{

const loss = 1000 + Math.floor(Math.random()*2000);

user.wallet = Math.max(0,user.wallet-loss);

user.lastCrime = now;

save();

return message.reply(`🚓 You got caught\n-${loss} coins`);

}

}

// ================= ROB =================

if(cmd==="rob"){

const target = message.mentions.users.first();

if(!target) return message.reply("Mention user to rob");

if(target.id===message.author.id)
return message.reply("You can't rob yourself");

const victim = getUser(target.id);

if(victim.wallet < 1000)
return message.reply("Target too poor");

const now = Date.now();

const cooldown = 10800000;

if(now - user.lastRob < cooldown){

const time = cooldown - (now-user.lastRob);

const mins = Math.floor(time/60000);

return message.reply(`⏳ Rob cooldown\n${mins}m left`);

}

const success = Math.random() < 0.4;

if(success){

const steal = Math.floor(victim.wallet*0.3);

victim.wallet -= steal;

user.wallet += steal;

save();

return message.reply(`🗡 Rob success\nStole ${steal} coins`);

}else{

const fine = 1000;

user.wallet = Math.max(0,user.wallet-fine);

save();

return message.reply(`🚓 Rob failed\nYou paid ${fine} coins`);

}

}

// ================= PAY =================

if(cmd==="pay"){

const target = message.mentions.users.first();

if(!target) return message.reply("Mention user");

if(target.id===message.author.id)
return message.reply("You can't pay yourself");

const amount = parseInt(args[1]);

if(!amount || amount<=0)
return message.reply("Invalid amount");

if(user.wallet < amount)
return message.reply("Not enough coins");

const receiver = getUser(target.id);

user.wallet -= amount;

receiver.wallet += amount;

save();

return message.reply(`💸 Paid ${amount} coins to ${target.username}`);

 }
// ================= SHOP =================

const shop = {

laptop:{price:15000,name:"💻 Laptop"},
phone:{price:8000,name:"📱 Phone"},
car:{price:50000,name:"🚗 Car"},
mansion:{price:200000,name:"🏠 Mansion"}

};

if(cmd==="shop"){

let text="🛒 SHOP\n\n";

for(const item in shop){

text+=`${shop[item].name} — ${shop[item].price} coins\n`;

}

return message.reply(text);

}

// ================= BUY =================

if(cmd==="buy"){

const item = args[0];

if(!shop[item])
return message.reply("Item not found");

const price = shop[item].price;

if(user.wallet < price)
return message.reply("Not enough coins");

user.wallet -= price;

if(!user.inventory) user.inventory=[];

user.inventory.push(item);

save();

return message.reply(`✅ Bought ${shop[item].name}`);

}

// ================= INVENTORY =================

if(cmd==="inventory"||cmd==="inv"){

if(!user.inventory || user.inventory.length===0)
return message.reply("Inventory empty");

let text="🎒 INVENTORY\n\n";

user.inventory.forEach(i=>{

text+=`${shop[i].name}\n`;

});

return message.reply(text);

}

// ================= PROFILE =================

if(cmd==="profile"){

const target = message.mentions.users.first() || message.author;

const data = getUser(target.id);

const embed = new EmbedBuilder()

.setColor("Blue")

.setTitle(`${target.username} Profile`)

.setDescription(`

💰 Wallet: ${data.wallet}

🏦 Bank: ${data.bank}

🎒 Items: ${data.inventory ? data.inventory.length : 0}

`);

return message.reply({embeds:[embed]});

}

// ================= LEADERBOARD =================

if(cmd==="leaderboard"||cmd==="lb"){

const top = Object.entries(db)

.sort((a,b)=>(b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank))

.slice(0,10);

let text="🏆 LEADERBOARD\n\n";

top.forEach((u,i)=>{

text+=`${i+1}. <@${u[0]}> — ${u[1].wallet+u[1].bank}\n`;

});

return message.reply(text);

}

// ================= RANK =================

if(cmd==="rank"){

const users = Object.entries(db)

.sort((a,b)=>(b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank]);

const pos = users.findIndex(u=>u[0]===message.author.id)+1;

return message.reply(`🏅 Your rank: ${pos}/${users.length}`);

                                      }
