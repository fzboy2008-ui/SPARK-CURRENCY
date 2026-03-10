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

/* PREFIX */

const prefixes = ["s","S","spark","Spark","SPARK"];

/* DATABASE */

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

/* READY */

client.on("ready",()=>{

console.log("🔥 SPARK BOT V4 ONLINE");

});

/* BATTLE STORAGE */

let battles = {};
/* MESSAGE HANDLER */

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
selected:{},
level:1
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

if(!bet) return message.reply("Enter bet");

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

if(!bet) return message.reply("Enter bet");

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

/* TEST ADMIN */

if(cmd==="admin"){

if(!isAdmin(message.author.id)){
return message.reply("❌ You are not admin");
}

return message.reply("✅ Admin command working");

}

/* ADMIN ADD COINS */

if(cmd==="addcoins"){

if(!isAdmin(message.author.id)){
return message.reply("❌ You are not admin");
}

let member = message.mentions.users.first();
let amount = parseInt(args[1]);

if(!member || !amount)
return message.reply("Usage: s addcoins @user amount");

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

saveAll();

return message.reply(`💰 Added ${amount} coins to ${member.username}`);

}
/* ADMIN ADD GEMS */

if(cmd==="addgems"){

if(!isAdmin(message.author.id)){
return message.reply("❌ You are not admin");
}

let member = message.mentions.users.first();
let amount = parseInt(args[1]);

if(!member || !amount)
return message.reply("Usage: s addgems @user amount");

economy[member.id].gems += amount;

saveAll();

return message.reply(`💎 Added ${amount} gems to ${member.username}`);

}
/* ADD ADMIN */

if(cmd==="addadmin"){

if(!isAdmin(message.author.id)){
return message.reply("❌ You are not admin");
}

let member = message.mentions.users.first();

if(!member) return message.reply("Mention user");

admins.push(member.id);

saveAll();

return message.reply(`👑 ${member.username} is now admin`);

}

/* ADMIN SET MONEY */

if(cmd==="setmoney"){

if(!isAdmin(message.author.id)){
return message.reply("❌ You are not admin");
}

let member = message.mentions.users.first();
let amount = parseInt(args[1]);

if(!member || isNaN(amount))
return message.reply("Usage: s setmoney @user amount");

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

economy[member.id].wallet = amount;

saveAll();

return message.reply(`💰 ${member.username} wallet set to ${amount}`);

}

/* CHALLENGE */

if(cmd==="challenge"){

let opponent = message.mentions.users.first();

if(!opponent) return message.reply("Mention user");

let inv1 = inventory[message.author.id];
let inv2 = inventory[opponent.id];

let dragon1 = inv1.selected.dragon || "None";
let dragon2 = inv2.selected.dragon || "None";

let element1 = dragons[dragon1]?.element || "None";
let element2 = dragons[dragon2]?.element || "None";

let hp1 = dragons[dragon1]?.hp || 100;
let hp2 = dragons[dragon2]?.hp || 100;

battles[opponent.id] = {
challenger: message.author.id,
hp1: hp1,
hp2: hp2
};

const embed = new EmbedBuilder()

.setColor("Red")

.setTitle("⚔ DRAGON BATTLE")

.setThumbnail(message.author.displayAvatarURL({dynamic:true}))

.setDescription(`
👤 ${message.author}  🆚  ${opponent}

━━━━━━━━━━━━━━━━

🐉 **${dragon1}**
Level : ${inv1.level}
Element : ${element1}

⚔ Weapon : ${inv1.selected.weapon || "None"}
🛡 Armour : ${inv1.selected.armour || "None"}

❤️ HP : ${hp1}

━━━━━━━━━━━━━━━━

🐉 **${dragon2}**
Level : ${inv2.level}
Element : ${element2}

⚔ Weapon : ${inv2.selected.weapon || "None"}
🛡 Armour : ${inv2.selected.armour || "None"}

❤️ HP : ${hp2}

━━━━━━━━━━━━━━━━

⚔ **Attacks**
• Slash
• Fire Blast
• Dragon Bite

${opponent} type **s accept**
`);

return message.channel.send({embeds:[embed]});

}

/* ACCEPT */

if(cmd==="accept"){

let battle = battles[message.author.id];

if(!battle)
return message.reply("No challenge");

let p1 = battle.challenger;
let p2 = message.author.id;

let dmg1 = Math.floor(Math.random()*30)+10;
let dmg2 = Math.floor(Math.random()*30)+10;

battle.hp2 -= dmg1;
battle.hp1 -= dmg2;

let winner;

if(battle.hp1 <= 0) winner = p2;
else if(battle.hp2 <= 0) winner = p1;

if(winner){

economy[winner].wallet += 10000;

delete battles[message.author.id];

return message.channel.send(`🏆 <@${winner}> won the battle and earned 10000 coins`);
}

return message.channel.send(`
⚔ Attack Round

<@${p1}> dealt **${dmg1}**
<@${p2}> dealt **${dmg2}**

HP
<@${p1}> : ${battle.hp1}
<@${p2}> : ${battle.hp2}
`);

}

/* HELP */

if(cmd==="help"){

const embed = new EmbedBuilder()

.setColor("Green")

.setTitle("📖 SPARK BOT COMMANDS")

.setDescription(`
💰 **ECONOMY**
\`s bal\`
\`s daily\`
\`s deposit <amount>\`
\`s withdraw <amount>\`
\`s give @user <amount>\`

🎰 **CASINO**
\`s cf <amount/all>\`
\`s slot <amount/all>\`

👤 **PLAYER**
\`s profile\`
\`s rank\`

🛒 **RPG**
\`s shop\`
\`s inv\`
\`s set <type> <item>\`
\`s upgrade\`
`);

return message.reply({embeds:[embed]});

}

/* RANK */

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
  
.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
  
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
/* SHOP */

if(cmd==="shop"){

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("shop_dragons")
.setLabel("Dragons")
.setEmoji("🐉")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_weapons")
.setLabel("Weapons")
.setEmoji("⚔")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_armours")
.setLabel("Armours")
.setEmoji("🛡")
.setStyle(ButtonStyle.Primary)

);

const embed = new EmbedBuilder()

.setColor("Orange")

.setTitle("🛒 SPARK SHOP")

.setDescription(`
📦 Category : Main Shop

━━━━━━━━━━━━━━━━━━━━━━

Select a category below

━━━━━━━━━━━━━━━━━━━━━━
`);

return message.reply({
embeds:[embed],
components:[row]
});

}

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

inv.level += 1;

saveAll();

return message.reply(`⬆ Dragon level upgraded to ${inv.level}`);

}
});

/* BUTTON HANDLER */

client.on("interactionCreate", async interaction=>{

if(!interaction.isButton()) return;

await interaction.deferReply();

/* DRAGON SHOP */

if(interaction.customId==="shop_dragons"){

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_grog")
.setLabel("Grog")
.setEmoji("🪨")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_phoenix")
.setLabel("Phoenix")
.setEmoji("🔥")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_triton")
.setLabel("Triton")
.setEmoji("🌊")
.setStyle(ButtonStyle.Success)

);

const row2 = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_rex")
.setLabel("Rex")
.setEmoji("⚡")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_zephyr")
.setLabel("Zephyr")
.setEmoji("🌪")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("shop_back")
.setLabel("Back")
.setEmoji("◀")
.setStyle(ButtonStyle.Secondary)

);

const embed = new EmbedBuilder()

.setColor("Orange")

.setDescription(`
📦 Category : 🐉 Dragons

━━━━━━━━━━━━━━━━━━━━━━

🪨 Grog — 6M  
🔥 Phoenix — 10M  
🌊 Triton — 8M  
⚡ Rex — 9M  
🌪 Zephyr — 7M  

━━━━━━━━━━━━━━━━━━━━━━
`);

return interaction.editReply({
embeds:[embed],
components:[row,row2]
});

}

/* WEAPON SHOP */

if(interaction.customId==="shop_weapons"){

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_flamesword")
.setLabel("Flame Sword")
.setEmoji("🔥")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_thunderblade")
.setLabel("Thunder Blade")
.setEmoji("⚡")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_aquaspear")
.setLabel("Aqua Spear")
.setEmoji("🌊")
.setStyle(ButtonStyle.Success)

);

const row2 = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_stonehammer")
.setLabel("Stone Hammer")
.setEmoji("🪨")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_winddagger")
.setLabel("Wind Dagger")
.setEmoji("🌪")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("shop_back")
.setLabel("Back")
.setEmoji("◀")
.setStyle(ButtonStyle.Secondary)

);

const embed = new EmbedBuilder()

.setColor("Orange")

.setDescription(`
📦 Category : ⚔ Weapons

━━━━━━━━━━━━━━━━━━━━━━

🔥 Flame Sword — 5M  
⚡ Thunder Blade — 4.5M  
🌊 Aqua Spear — 4M  
🪨 Stone Hammer — 3.5M  
🌪 Wind Dagger — 3M  

━━━━━━━━━━━━━━━━━━━━━━
`);

return interaction.editReply({
embeds:[embed],
components:[row,row2]
});

}

/* ARMOUR SHOP */

if(interaction.customId==="shop_armours"){

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_dragonplate")
.setLabel("Dragon Plate")
.setEmoji("🔥")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_thunderguard")
.setLabel("Thunder Guard")
.setEmoji("⚡")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_aquashield")
.setLabel("Aqua Shield")
.setEmoji("🌊")
.setStyle(ButtonStyle.Success)

);

const row2 = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("buy_eartharmor")
.setLabel("Earth Armor")
.setEmoji("🪨")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("buy_zephyrcloak")
.setLabel("Zephyr Cloak")
.setEmoji("🌪")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("shop_back")
.setLabel("Back")
.setEmoji("◀")
.setStyle(ButtonStyle.Secondary)

);

const embed = new EmbedBuilder()

.setColor("Orange")

.setDescription(`
📦 Category : 🛡 Armours

━━━━━━━━━━━━━━━━━━━━━━

🔥 Dragon Plate — 5M  
⚡ Thunder Guard — 4.5M  
🌊 Aqua Shield — 4M  
🪨 Earth Armor — 3.5M  
🌪 Zephyr Cloak — 3M  

━━━━━━━━━━━━━━━━━━━━━━
`);

return interaction.editReply({
embeds:[embed],
components:[row,row2]
});

}

/* BACK BUTTON */

if(interaction.customId==="shop_back"){

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("shop_dragons")
.setLabel("Dragons")
.setEmoji("🐉")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_weapons")
.setLabel("Weapons")
.setEmoji("⚔")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_armours")
.setLabel("Armours")
.setEmoji("🛡")
.setStyle(ButtonStyle.Primary)

);

const embed = new EmbedBuilder()

.setColor("Orange")

.setTitle("🛒 SPARK SHOP")

.setDescription(`
📦 Category : Main Shop

━━━━━━━━━━━━━━━━━━━━━━

Select a category below

━━━━━━━━━━━━━━━━━━━━━━
`);

return interaction.editReply({
embeds:[embed],
components:[row]
});

}

/* BUY SYSTEM */

if(interaction.customId.startsWith("buy_")){

let id = interaction.customId.replace("buy_","");

let item = dragons[id] || weapons[id] || armours[id];

let user = economy[interaction.user.id];
let inv = inventory[interaction.user.id];

if(user.wallet < item.price)
return interaction.editReply("❌ Not enough coins");

user.wallet -= item.price;

if(dragons[id]) inv.dragons.push(id);
if(weapons[id]) inv.weapons.push(id);
if(armours[id]) inv.armours.push(id);

saveAll();

return interaction.editReply(`✅ Purchased ${item.name}`);

}

});

/* LOGIN */

client.login(process.env.TOKEN);
