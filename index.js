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

function getPrefix(message){
const msg = message.content.toLowerCase();
for(const p of PREFIXES){
if(msg.startsWith(p+" ")) return p;
}
}

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
lastDaily:0,

inventory:{
dragons:{},
weapons:[],
armours:[]
},

equipped:{
dragon:null,
weapon:null,
armour:null
}

};

}

return users[id];

}

// ================= SHOP =================

const shop = {

dragons:{
phoenix:{name:"🔥 Phoenix",price:10000000},
triton:{name:"🌊 Triton",price:9000000},
rex:{name:"⚡ Rex",price:8000000},
zephyr:{name:"🌪 Zephyr",price:7000000},
grog:{name:"🪨 Grog",price:5000000}
},

weapons:{
flameblade:{name:"🔥 Flame Blade",price:5000000},
thunderhammer:{name:"⚡ Thunder Hammer",price:4000000},
dragonslayer:{name:"🐉 Dragon Slayer",price:3500000},
shadowdagger:{name:"🌑 Shadow Dagger",price:2000000},
crystalspear:{name:"💎 Crystal Spear",price:1000000}
},

armours:{
dragonscale:{name:"🐲 Dragon Scale Armour",price:5000000},
oceanguard:{name:"🌊 Ocean Guard Armour",price:4000000},
stormarmor:{name:"⚡ Storm Armour",price:3000000},
windcloak:{name:"🌪 Wind Cloak",price:2000000},
earthshield:{name:"🪨 Earth Shield",price:1000000}
}

};

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

return "█".repeat(filled)+"░".repeat(10-filled)+" "+percent+"%";

}

// ================= READY =================

client.once("ready",()=>{
console.log("⚡ Spark Bot Online: "+client.user.tag);
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

user.xp++;

const required = (user.level+1)*2500;

if(user.xp >= required && user.level < 50){

user.level++;

const reward = user.level*5000;

user.wallet += reward;

message.channel.send({

embeds:[
new EmbedBuilder()

.setColor("Green")

.setTitle("⭐ LEVEL UP")

.setDescription(`

${message.author.username}

${user.level-1} → ${user.level}

💰 +${reward} Coins

`)

]

});

save();

}

// ================= HELP =================

if(cmd==="help"){

return message.reply({

embeds:[
new EmbedBuilder()

.setColor("Blue")

.setTitle("⚡ SPARK COMMANDS")

.setDescription(`

💰 ECONOMY
s bal
s daily
s deposit
s withdraw

🎰 CASINO
s cf
s slot

👤 PLAYER
s profile
s rank

🏪 RPG
s shop
s buy
s inv
s set
s upgrade

`)

]

});

}

// ================= BAL =================

if(cmd==="bal"||cmd==="balance"){

return message.reply({

embeds:[
new EmbedBuilder()

.setColor("Gold")

.setTitle("💰 BALANCE")

.setDescription(`

👤 ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank : ${user.bank}
💎 Gems : ${user.gems}

`)

]

});

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

return message.reply(`Next Daily In ${h}h ${m}m ${s}s`);

}

user.wallet+=1000;
user.lastDaily=now;

save();

return message.reply({

embeds:[
new EmbedBuilder()

.setColor("Green")

.setTitle("🎁 DAILY")

.setDescription("💰 +1000 Coins")

]

});

}

// ================= DEPOSIT =================

if(cmd==="deposit"){

const amount = parseInt(args[0]);

if(!amount) return message.reply("Enter amount");

if(user.wallet < amount) return message.reply("Not enough coins");

user.wallet-=amount;
user.bank+=amount;

save();

return message.reply(`🏦 Deposited ${amount}`);

}

// ================= WITHDRAW =================

if(cmd==="withdraw"){

const amount = parseInt(args[0]);

if(!amount) return message.reply("Enter amount");

if(user.bank < amount) return message.reply("Not enough coins");

user.bank-=amount;
user.wallet+=amount;

save();

return message.reply(`💸 Withdrawn ${amount}`);

}

// ================= PROFILE =================

if(cmd==="profile"){

const rank = getRank(user.level);
const bar = xpBar(user.xp,user.level);

return message.reply({

embeds:[
new EmbedBuilder()

.setColor("Blue")

.setTitle("👤 PLAYER PROFILE")

.setThumbnail(message.author.displayAvatarURL())

.setDescription(`

🏆 Rank : ${rank}
⭐ Level : ${user.level}

⚡ XP
${bar}

━━━━━━━━━━━━━━

💵 Wallet : ${user.wallet}
🏦 Bank : ${user.bank}
💎 Gems : ${user.gems}

━━━━━━━━━━━━━━

🐉 Dragon : ${user.equipped.dragon || "None"}
⚔ Weapon : ${user.equipped.weapon || "None"}
🛡 Armour : ${user.equipped.armour || "None"}

`)

]

});

}

// ================= SHOP =================

if(cmd==="shop"){

const cat = args[0];

if(!cat){

return message.reply({

embeds:[
new EmbedBuilder()

.setColor("Green")

.setTitle("🏪 SHOP")

.setDescription(`

s shop dragons
s shop weapons
s shop armours

`)

]

});

}

let items = shop[cat];

if(!items) return message.reply("Invalid shop");

let text="";

for(let i in items){
text+=`${items[i].name}
💰 ${items[i].price}

`;
}

return message.reply({

embeds:[
new EmbedBuilder()

.setColor("Gold")

.setTitle(`🏪 ${cat.toUpperCase()}`)

.setDescription(text)

]

});

}

// ================= BUY =================

if(cmd==="buy"){

const cat=args[0];
const item=args[1];

if(cat==="dragon"){

const data = shop.dragons[item];

if(!data) return message.reply("Dragon not found");

if(user.wallet < data.price)
return message.reply("Not enough coins");

user.wallet-=data.price;

user.inventory.dragons[item]={level:1};

save();

return message.reply(`🐉 Bought ${data.name}`);

}

}

// ================= INVENTORY =================

if(cmd==="inv"){

const dragons = Object.keys(user.inventory.dragons).join("\n") || "None";
const weapons = user.inventory.weapons.join("\n") || "None";
const armours = user.inventory.armours.join("\n") || "None";

return message.reply({

embeds:[
new EmbedBuilder()

.setColor("Purple")

.setTitle("🎒 INVENTORY")

.setDescription(`

🐉 Dragons
${dragons}

⚔ Weapons
${weapons}

🛡 Armours
${armours}

`)

]

});

}

save();

});

client.login(process.env.TOKEN);
