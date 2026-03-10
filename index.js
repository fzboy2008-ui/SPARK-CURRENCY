const {
Client,
GatewayIntentBits,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle
} = require("discord.js");

const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const prefixes = ["s","S","spark","Spark","SPARK"];

let economy = {};
let inventory = {};
let admins = [];

/* LOAD DATA */

if(fs.existsSync("./economy.json")){
economy = JSON.parse(fs.readFileSync("./economy.json"));
}

if(fs.existsSync("./inventory.json")){
inventory = JSON.parse(fs.readFileSync("./inventory.json"));
}

if(fs.existsSync("./admins.json")){
admins = JSON.parse(fs.readFileSync("./admins.json"));
}

/* SAVE FUNCTION */

function saveAll(){

fs.writeFileSync("./economy.json",JSON.stringify(economy,null,2));
fs.writeFileSync("./inventory.json",JSON.stringify(inventory,null,2));
fs.writeFileSync("./admins.json",JSON.stringify(admins,null,2));

}

/* ADMIN CHECK */

function isAdmin(id){
return admins.includes(id);
}

/* MAX BET */

const maxBet = 100000;

/* DRAGONS */

const dragons = {

grog:{
name:"🪨 Grog",
element:"Earth",
price:6000000,
hp:120
},

phoenix:{
name:"🔥 Phoenix",
element:"Fire",
price:10000000,
hp:130
},

triton:{
name:"🌊 Triton",
element:"Water",
price:8000000,
hp:125
},

rex:{
name:"⚡ Rex",
element:"Lightning",
price:9000000,
hp:128
},

zephyr:{
name:"🌪️ Zephyr",
element:"Wind",
price:7000000,
hp:122
}

};

/* WEAPONS */

const weapons = {

flamesword:{
name:"🔥 Flame Sword",
attack:20,
price:5000000
},

thunderblade:{
name:"⚡ Thunder Blade",
attack:18,
price:4500000
},

aquaspear:{
name:"🌊 Aqua Spear",
attack:16,
price:4000000
},

stonehammer:{
name:"🪨 Stone Hammer",
attack:15,
price:3500000
},

winddagger:{
name:"🌪️ Wind Dagger",
attack:14,
price:3000000
}

};

/* ARMOURS */

const armours = {

dragonplate:{
name:"🔥 Dragon Plate",
def:20,
price:5000000
},

thunderguard:{
name:"⚡ Thunder Guard",
def:18,
price:4500000
},

aquashield:{
name:"🌊 Aqua Shield",
def:16,
price:4000000
},

eartharmor:{
name:"🪨 Earth Armor",
def:15,
price:3500000
},

zephyrcloak:{
name:"🌪️ Zephyr Cloak",
def:14,
price:3000000
}

};

client.on("ready",()=>{

console.log("🔥 SPARK BOT V3 ONLINE");

});
client.on("messageCreate", async message => {

if(message.author.bot) return;

const prefix = prefixes.find(p => message.content.startsWith(p));
if(!prefix) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

/* CREATE USER DATA */

if(!economy[message.author.id]){

economy[message.author.id] = {
wallet:0,
bank:0,
gems:0,
daily:0,
xp:0,
level:0,
battles:0
};

}

if(!inventory[message.author.id]){

inventory[message.author.id] = {
dragons:[],
weapons:[],
armours:[],
selected:{}
};

}

let user = economy[message.author.id];
let inv = inventory[message.author.id];

/* XP SYSTEM */

user.xp += 1;

const xpNeed = (user.level + 1) * 2500;

if(user.xp >= xpNeed){

user.xp = 0;
user.level += 1;

let reward = user.level * 5000;

user.wallet += reward;

message.channel.send(`⭐ ${message.author} leveled up to **${user.level}**\n💰 Reward: ${reward}`);

}

/* BAL */

if(cmd==="bal"){

const embed = new EmbedBuilder()

.setColor("Grey")

.setDescription(`
👤 ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}
`);

return message.reply({embeds:[embed]});

}

/* DAILY */

if(cmd==="daily"){

const cooldown = 86400000;

if(Date.now() - user.daily < cooldown){

return message.reply("❌ You already claimed daily reward");

}

let reward = 1000;

user.wallet += reward;
user.daily = Date.now();

saveAll();

const embed = new EmbedBuilder()

.setColor("Gold")

.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Reward : ${reward}

💵 Wallet : ${user.wallet}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

return message.reply({embeds:[embed]});

}

/* DEPOSIT */

if(cmd==="deposit"){

let amount = parseInt(args[0]);

if(!amount) return message.reply("Enter amount");

if(user.wallet < amount)
return message.reply("Not enough coins");

user.wallet -= amount;
user.bank += amount;

saveAll();

return message.reply(`🏦 Deposited ${amount}`);

}

/* WITHDRAW */

if(cmd==="withdraw"){

let amount = parseInt(args[0]);

if(!amount) return;

if(user.bank < amount)
return message.reply("Not enough balance");

user.bank -= amount;
user.wallet += amount;

saveAll();

return message.reply(`💵 Withdraw ${amount}`);

}

/* GIVE */

if(cmd==="give"){

let member = message.mentions.users.first();
let amount = parseInt(args[1]);

if(!member) return;

if(user.wallet < amount)
return message.reply("Not enough coins");

if(!economy[member.id]){

economy[member.id] = {
wallet:0,
bank:0,
gems:0,
daily:0,
xp:0,
level:0,
battles:0
};

}

economy[member.id].wallet += amount;
user.wallet -= amount;

saveAll();

return message.reply(`💸 Sent ${amount} coins`);

}

/* COINFLIP */

if(cmd==="cf"){

let bet = args[0];

if(bet==="all") bet = Math.min(user.wallet,maxBet);
else bet = Math.min(parseInt(bet),maxBet);

if(user.wallet < bet)
return message.reply("Not enough coins");

user.wallet -= bet;

const msg = await message.reply("🪙 Flipping coin...");

await new Promise(r=>setTimeout(r,1500));

let win = Math.random() < 0.25;

if(win){

let reward = bet * 2;

user.wallet += reward;

msg.edit(`🪙 HEADS\nYou won ${reward}`);

}else{

msg.edit(`🔘 TAILS\nYou lost ${bet}`);

}

saveAll();

}

/* SLOT */

if(cmd==="slot"){

let bet = args[0];

if(bet==="all") bet = Math.min(user.wallet,maxBet);
else bet = Math.min(parseInt(bet),maxBet);

if(user.wallet < bet)
return message.reply("Not enough coins");

user.wallet -= bet;

const msg = await message.reply("🎰 Spinning...");

await new Promise(r=>setTimeout(r,1500));

let items = ["💎","🍎","🥬","🅾️"];

let r = items[Math.floor(Math.random()*items.length)];

let multi = {

"💎":3,
"🍎":2,
"🥬":1,
"🅾️":0

}[r];

let reward = bet * multi;

user.wallet += reward;

msg.edit(`
🎰 SLOT

${r} ${r} ${r}

Reward : ${reward}
`);

saveAll();

  }
/* SHOP COMMAND */

if(cmd==="shop"){

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("shop_dragons")
.setLabel("🐉 Dragons")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_weapons")
.setLabel("⚔ Weapons")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_armours")
.setLabel("🛡 Armours")
.setStyle(ButtonStyle.Primary)

);

const embed = new EmbedBuilder()

.setColor("Orange")

.setTitle("🛒 SHOP")

.setDescription("Select a category");

return message.reply({
embeds:[embed],
components:[row]
});

}

/* BUTTON HANDLER */

client.on("interactionCreate", async interaction=>{

if(!interaction.isButton()) return;

/* DRAGON SHOP */

if(interaction.customId==="shop_dragons"){

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_grog")
.setLabel("Buy Grog")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_phoenix")
.setLabel("Buy Phoenix")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_triton")
.setLabel("Buy Triton")
.setStyle(ButtonStyle.Success)

);

const row2 = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_rex")
.setLabel("Buy Rex")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_zephyr")
.setLabel("Buy Zephyr")
.setStyle(ButtonStyle.Success)

);

const embed = new EmbedBuilder()

.setColor("Orange")

.setTitle("🐉 Dragon Shop")

.setDescription(`

🪨 Grog — 6M  
🔥 Phoenix — 10M  
🌊 Triton — 8M  
⚡ Rex — 9M  
🌪️ Zephyr — 7M

`);

return interaction.reply({
embeds:[embed],
components:[row,row2]
});

}

/* WEAPON SHOP */

if(interaction.customId==="shop_weapons"){

const embed = new EmbedBuilder()

.setTitle("⚔ Weapon Shop")

.setDescription(`

🔥 Flame Sword — 5M  
⚡ Thunder Blade — 4.5M  
🌊 Aqua Spear — 4M  
🪨 Stone Hammer — 3.5M  
🌪 Wind Dagger — 3M

`);

return interaction.reply({embeds:[embed]});

}

/* ARMOUR SHOP */

if(interaction.customId==="shop_armours"){

const embed = new EmbedBuilder()

.setTitle("🛡 Armour Shop")

.setDescription(`

🔥 Dragon Plate — 5M  
⚡ Thunder Guard — 4.5M  
🌊 Aqua Shield — 4M  
🪨 Earth Armor — 3.5M  
🌪 Zephyr Cloak — 3M

`);

return interaction.reply({embeds:[embed]});

}

/* BUY DRAGON */

if(interaction.customId.startsWith("buy_")){

let id = interaction.customId.replace("buy_","");

let dragon = dragons[id];

let user = economy[interaction.user.id];
let inv = inventory[interaction.user.id];

if(user.wallet < dragon.price)
return interaction.reply({content:"Not enough coins",ephemeral:true});

user.wallet -= dragon.price;

inv.dragons.push(id);

saveAll();

return interaction.reply(`🐉 Purchased ${dragon.name}`);

}

});

/* INVENTORY */

if(cmd==="inv"){

const embed = new EmbedBuilder()

.setTitle("🎒 Inventory")

.setDescription(`

🐉 Dragons
${inv.dragons.join("\n") || "None"}

⚔ Weapons
${inv.weapons.join("\n") || "None"}

🛡 Armours
${inv.armours.join("\n") || "None"}

`);

return message.reply({embeds:[embed]});

}

/* SET EQUIPMENT */

if(cmd==="set"){

let type = args[0];
let item = args[1];

if(!type || !item)
return message.reply("Usage: s set <type> <item>");

inv.selected[type] = item;

saveAll();

return message.reply(`✅ ${item} selected`);

}

/* UPGRADE DRAGON */

if(cmd==="upgrade"){

if(!inv.selected.dragon)
return message.reply("Select dragon first");

if(user.gems < 100)
return message.reply("Need 100 gems");

user.gems -= 100;

if(!inv.level) inv.level = 1;

inv.level += 1;

saveAll();

return message.reply(`⬆ Dragon level upgraded to ${inv.level}`);

          }
/* BATTLE STORAGE */

let battles = {};

/* CHALLENGE */

if(cmd==="challenge"){

let target = message.mentions.users.first();

if(!target) return message.reply("Mention user");

battles[target.id] = message.author.id;

return message.reply(`⚔ ${target} you were challenged!
Type **s challenge accept**`);

}

/* ACCEPT */

if(cmd==="challenge" && args[0]==="accept"){

let opponent = battles[message.author.id];

if(!opponent)
return message.reply("No challenge found");

let p1 = inventory[opponent];
let p2 = inventory[message.author.id];

let d1 = dragons[p1.selected.dragon];
let d2 = dragons[p2.selected.dragon];

if(!d1 || !d2)
return message.reply("Both players must select dragon");

let hp1 = d1.hp + (p1.level || 1)*5;
let hp2 = d2.hp + (p2.level || 1)*5;

let max1 = hp1;
let max2 = hp2;

function bar(hp,max){

let total = 10;

let filled = Math.max(0,Math.round((hp/max)*total));

return "█".repeat(filled) + "░".repeat(total-filled);

}

const msg = await message.reply("⚔ Battle Starting...");

while(hp1 > 0 && hp2 > 0){

await new Promise(r=>setTimeout(r,2000));

let atk1 = Math.floor(Math.random()*20)+5;
let atk2 = Math.floor(Math.random()*20)+5;

hp1 -= atk2;
hp2 -= atk1;

const embed = new EmbedBuilder()

.setColor("Red")

.setTitle("⚔ BATTLE")

.setDescription(`

👤 <@${opponent}>

🐉 ${d1.name}
❤️ ${bar(hp1,max1)}

VS

👤 ${message.author}

🐉 ${d2.name}
❤️ ${bar(hp2,max2)}

`);

await msg.edit({embeds:[embed]});

}

let winner = hp1 > hp2 ? opponent : message.author.id;

economy[winner].gems += 25;

economy[winner].battles += 1;

saveAll();

return msg.reply(`🏆 Winner: <@${winner}>
+25 💎 Gems`);

}
/* RANK COMMAND */

if(cmd==="rank"){

let rank = "🥉 Bronze";

if(user.level >= 50) rank="👑 Mythic";
else if(user.level >= 40) rank="💎 Diamond";
else if(user.level >= 30) rank="🥇 Gold";
else if(user.level >= 20) rank="🥈 Silver";

let progress = Math.floor((user.xp / ((user.level+1)*2500))*10);

let bar = "█".repeat(progress) + "░".repeat(10-progress);

const embed = new EmbedBuilder()

.setColor("Gold")
  
.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
  
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━

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

━━━━━━━━━━━━━━━━━━━━━━
`);

return message.reply({embeds:[embed]});

}

/* PROFILE */

if(cmd==="profile"){

let rank = "🥉 Bronze";

if(user.level >= 50) rank="👑 Mythic";
else if(user.level >= 40) rank="💎 Diamond";
else if(user.level >= 30) rank="🥇 Gold";
else if(user.level >= 20) rank="🥈 Silver";

let progress = Math.floor((user.xp / ((user.level + 1) * 2500)) * 10);

let bar = "█".repeat(progress) + "░".repeat(10-progress);

const embed = new EmbedBuilder()

.setColor("Blue")

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

🐉 Dragon : ${inv.selected.dragon || "None"}
⚔ Weapon : ${inv.selected.weapon || "None"}
🛡 Armour : ${inv.selected.armour || "None"}
`);

return message.reply({embeds:[embed]});

}

/* BALANCE LEADERBOARD */

if(cmd==="lb" || cmd==="leaderboard"){

let type = args[0];

if(type==="balance"){

let top = Object.entries(economy)

.sort((a,b)=>(b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank))

.slice(0,10);

let text="";

top.forEach((u,i)=>{

let medal=["🥇","🥈","🥉"][i] || `${i+1}`;

text+=`
${medal} <@${u[0]}>
🪙 ${(u[1].wallet+u[1].bank)}
💎 ${u[1].gems}
`;

});

const embed = new EmbedBuilder()

.setTitle("💰 Balance Leaderboard")

.setDescription(text);

return message.reply({embeds:[embed]});

}

}

/* BATTLE LEADERBOARD */

if(cmd==="lb" || cmd==="leaderboard"){

let type = args[0];

if(type==="battles"){

let top = Object.entries(economy)

.sort((a,b)=>b[1].battles-a[1].battles)

.slice(0,10);

let text="";

top.forEach((u,i)=>{

let medal=["🥇","🥈","🥉"][i] || `${i+1}`;

text+=`
${medal} <@${u[0]}>
⚔ Battles : ${u[1].battles}
`;

});

const embed = new EmbedBuilder()

.setTitle("⚔ Battle Leaderboard")

.setDescription(text);

return message.reply({embeds:[embed]});

}

}

/* ADMIN SET MONEY */

if(cmd==="setmoney"){

if(!isAdmin(message.author.id)) return;

let member = message.mentions.users.first();

let amount = parseInt(args[1]);

if(!member) return;

economy[member.id].wallet = amount;

saveAll();

return message.reply("Money updated");

}

/* ADMIN SET GEMS */

if(cmd==="setgems"){

if(!isAdmin(message.author.id)) return;

let member = message.mentions.users.first();

let amount = parseInt(args[1]);

if(!member) return;

economy[member.id].gems = amount;

saveAll();

return message.reply("Gems updated");

}

/* ADMIN ADD */

if(cmd==="admin" && args[0]==="add"){

if(!isAdmin(message.author.id)) return;

let member = message.mentions.users.first();

admins.push(member.id);

saveAll();

return message.reply("Admin added");

}

/* ADMIN REMOVE */

if(cmd==="admin" && args[0]==="remove"){

if(!isAdmin(message.author.id)) return;

let member = message.mentions.users.first();

admins = admins.filter(a=>a!==member.id);

saveAll();

return message.reply("Admin removed");

}

/* ADMIN LIST */

if(cmd==="admin" && args[0]==="list"){

let text="";

admins.forEach(id=>{
text += `<@${id}>\n`;
});

return message.reply(text);

}

/* RELOAD */

if(cmd==="reloadall"){

if(!isAdmin(message.author.id)) return;

economy = JSON.parse(fs.readFileSync("./economy.json"));
inventory = JSON.parse(fs.readFileSync("./inventory.json"));
admins = JSON.parse(fs.readFileSync("./admins.json"));

return message.reply("♻ Data reloaded");

}

});

/* LOGIN */

client.login(process.env.TOKEN);
