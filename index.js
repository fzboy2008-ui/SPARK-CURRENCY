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
phoenix:{name:"🔥 Phoenix",price:10000000,element:"fire"},
triton:{name:"🌊 Triton",price:9000000,element:"water"},
rex:{name:"⚡ Rex",price:8000000,element:"lightning"},
zephyr:{name:"🌪 Zephyr",price:7000000,element:"wind"},
grog:{name:"🪨 Grog",price:5000000,element:"earth"}
},

weapons:{
flameblade:{name:"🔥 Flame Blade",price:5000000,attack:50},
thunderhammer:{name:"⚡ Thunder Hammer",price:4000000,attack:40},
dragonslayer:{name:"🐉 Dragon Slayer",price:3500000,attack:35},
shadowdagger:{name:"🌑 Shadow Dagger",price:2000000,attack:25},
crystalspear:{name:"💎 Crystal Spear",price:1000000,attack:15}
},

armours:{
dragonscale:{name:"🐲 Dragon Scale Armour",price:5000000,defence:50},
oceanguard:{name:"🌊 Ocean Guard Armour",price:4000000,defence:40},
stormarmor:{name:"⚡ Storm Armour",price:3000000,defence:30},
windcloak:{name:"🌪 Wind Cloak",price:2000000,defence:20},
earthshield:{name:"🪨 Earth Shield",price:1000000,defence:15}
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
const bar = "█".repeat(filled)+"░".repeat(10-filled);

return `${bar} ${percent}%`;

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

user.xp += 1;

const required = (user.level+1)*2500;

if(user.xp >= required && user.level < 50){

user.level++;

const reward = user.level*5000;

user.wallet += reward;

const embed = new EmbedBuilder()

.setColor("Green")
.setTitle("⭐ LEVEL UP")

.setDescription(`${message.author.username}

${user.level-1} → ${user.level}

💰 +${reward} Coins`);

message.channel.send({embeds:[embed]});

save();

}

// ================= PROFILE =================

if(cmd==="profile"){

const rank = getRank(user.level);

const bar = xpBar(user.xp,user.level);

const dragon = user.equipped.dragon || "None";
const weapon = user.equipped.weapon || "None";
const armour = user.equipped.armour || "None";

const embed = new EmbedBuilder()

.setColor("Blue")
.setTitle("👤 PLAYER PROFILE")

.setThumbnail(message.author.displayAvatarURL())

.setDescription(`

🏆 Rank : ${rank}
⭐ Level : ${user.level}

⚡ XP
${bar}

━━━━━━━━━━━━━━━━━━━━━━

💰 ECONOMY

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

━━━━━━━━━━━━━━━━━━━━━━

🐉 Dragon : ${dragon}
⚔ Weapon : ${weapon}
🛡 Armour : ${armour}

`);

return message.reply({embeds:[embed]});

}

// ================= SHOP =================

if(cmd==="shop"){

const cat = args[0];

if(!cat){

const embed = new EmbedBuilder()

.setColor("Green")
.setTitle("🏪 SPARK SHOP")

.setDescription(`

🐉 s shop dragons
⚔ s shop weapons
🛡 s shop armours

`);

return message.reply({embeds:[embed]});

}

if(cat==="dragons"){

let text="";

for(let d in shop.dragons){
text+=`${shop.dragons[d].name}
💰 ${shop.dragons[d].price}

`;
}

return message.reply({embeds:[
new EmbedBuilder().setColor("Red").setTitle("🐉 DRAGONS").setDescription(text)
]});

}

if(cat==="weapons"){

let text="";

for(let w in shop.weapons){
text+=`${shop.weapons[w].name}
💰 ${shop.weapons[w].price}

`;
}

return message.reply({embeds:[
new EmbedBuilder().setColor("Blue").setTitle("⚔ WEAPONS").setDescription(text)
]});

}

if(cat==="armours"){

let text="";

for(let a in shop.armours){
text+=`${shop.armours[a].name}
💰 ${shop.armours[a].price}

`;
}

return message.reply({embeds:[
new EmbedBuilder().setColor("Purple").setTitle("🛡 ARMOURS").setDescription(text)
]});

}

}

// ================= BUY =================

if(cmd==="buy"){

const cat=args[0];
const name=args[1];

if(cat==="dragon"){

const item=shop.dragons[name];

if(!item) return message.reply("Dragon not found");

if(user.wallet < item.price)
return message.reply("Not enough coins");

user.wallet -= item.price;

user.inventory.dragons[name]={level:1};

save();

return message.reply(`🐉 Bought ${item.name}`);

}

if(cat==="weapon"){

const item=shop.weapons[name];

if(!item) return message.reply("Weapon not found");

if(user.wallet < item.price)
return message.reply("Not enough coins");

user.wallet -= item.price;

user.inventory.weapons.push(name);

save();

return message.reply(`⚔ Bought ${item.name}`);

}

if(cat==="armour"){

const item=shop.armours[name];

if(!item) return message.reply("Armour not found");

if(user.wallet < item.price)
return message.reply("Not enough coins");

user.wallet -= item.price;

user.inventory.armours.push(name);

save();

return message.reply(`🛡 Bought ${item.name}`);

}

}

// ================= INVENTORY =================

if(cmd==="inv"){

const dragons = Object.keys(user.inventory.dragons).join("\n") || "None";
const weapons = user.inventory.weapons.join("\n") || "None";
const armours = user.inventory.armours.join("\n") || "None";

return message.reply({embeds:[
new EmbedBuilder()
.setColor("Gold")
.setTitle("🎒 INVENTORY")
.setDescription(`

🐉 Dragons
${dragons}

⚔ Weapons
${weapons}

🛡 Armours
${armours}

`)
]});

}

// ================= SET =================

if(cmd==="set"){

const cat=args[0];
const name=args[1];

if(cat==="dragon"){
user.equipped.dragon=name;
}

if(cat==="weapon"){
user.equipped.weapon=name;
}

if(cat==="armour"){
user.equipped.armour=name;
}

save();

return message.reply("Equipment Updated");

}

// ================= DRAGON UPGRADE =================

if(cmd==="upgrade"){

const dragon=user.equipped.dragon;

if(!dragon) return message.reply("Select dragon first");

if(user.gems < 100)
return message.reply("Need 100 gems");

const d=user.inventory.dragons[dragon];

d.level++;

user.gems -= 100;

save();

return message.reply(`🐉 ${dragon} upgraded

Level ${d.level}/250

💎 -100 Gems`);

}

});

client.login(process.env.TOKEN);
