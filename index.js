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

////////////////////////////
//// PREFIX
////////////////////////////

const prefixes = ["s","S","spark","Spark","SPARK"];

////////////////////////////
//// DATABASE
////////////////////////////

let economy = {};
let inventory = {};
let admins = [];
let battles = {};

////////////////////////////
//// LOAD FILES
////////////////////////////

if(fs.existsSync("./economy.json")){
economy = JSON.parse(fs.readFileSync("./economy.json"));
}

if(fs.existsSync("./inventory.json")){
inventory = JSON.parse(fs.readFileSync("./inventory.json"));
}

if(fs.existsSync("./admins.json")){
admins = JSON.parse(fs.readFileSync("./admins.json"));
}

////////////////////////////
//// SAVE
////////////////////////////

function saveAll(){

fs.writeFileSync("./economy.json",JSON.stringify(economy,null,2));
fs.writeFileSync("./inventory.json",JSON.stringify(inventory,null,2));
fs.writeFileSync("./admins.json",JSON.stringify(admins,null,2));

}

////////////////////////////
//// ADMIN CHECK
////////////////////////////

function isAdmin(id){
return admins.includes(id);
}

////////////////////////////
//// MAX BET
////////////////////////////

const maxBet = 100000;

////////////////////////////
//// DRAGONS
////////////////////////////

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

////////////////////////////
//// WEAPONS
////////////////////////////

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

////////////////////////////
//// ARMOURS
////////////////////////////

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

////////////////////////////
//// READY
////////////////////////////

client.on("ready",()=>{

console.log("🔥 SPARK V5 ONLINE");

});

////////////////////////////
//// MESSAGE HANDLER
////////////////////////////

client.on("messageCreate", async message => {

if(message.author.bot) return;

const prefix = prefixes.find(p =>
message.content.startsWith(p));

if(!prefix) return;

const args =
message.content.slice(prefix.length)
.trim()
.split(/ +/);

const cmd = args.shift().toLowerCase();

////////////////////////////
//// CREATE USER
////////////////////////////

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
////////////////////////////
//// BAL
////////////////////////////

if(cmd==="bal"){

const embed = new EmbedBuilder()

.setColor("Grey")

.setDescription(`
👤 ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank : ${user.bank}
💎 Gems : ${user.gems}
`);

return message.reply({embeds:[embed]});

}

////////////////////////////
//// DAILY
////////////////////////////

if(cmd==="daily"){

let cd = 86400000;

if(Date.now() - user.daily < cd)
return message.reply("Already claimed");

let reward = 1000;

user.wallet += reward;
user.daily = Date.now();

saveAll();

return message.reply(`💰 Daily ${reward}`);

}

////////////////////////////
//// DEPOSIT
////////////////////////////

if(cmd==="deposit"){

let amount = parseInt(args[0]);

if(!amount) return;

if(user.wallet < amount)
return message.reply("No money");

user.wallet -= amount;
user.bank += amount;

saveAll();

return message.reply(`🏦 ${amount} deposited`);

}

////////////////////////////
//// WITHDRAW
////////////////////////////

if(cmd==="withdraw"){

let amount = parseInt(args[0]);

if(!amount) return;

if(user.bank < amount)
return message.reply("No bank money");

user.bank -= amount;
user.wallet += amount;

saveAll();

return message.reply(`💵 ${amount} withdraw`);

}

////////////////////////////
//// GIVE
////////////////////////////

if(cmd==="give"){

let member = message.mentions.users.first();
let amount = parseInt(args[1]);

if(!member || !amount) return;

if(user.wallet < amount)
return message.reply("No money");

if(!economy[member.id]) return;

user.wallet -= amount;
economy[member.id].wallet += amount;

saveAll();

return message.reply("Sent");

}

////////////////////////////
//// ADMIN SETMONEY
////////////////////////////

if(cmd==="setmoney"){

if(!isAdmin(message.author.id))
return message.reply("Not admin");

let m = message.mentions.users.first();
let amount = parseInt(args[1]);

if(!m || isNaN(amount)) return;

economy[m.id].wallet = amount;

saveAll();

return message.reply("Done");

}

////////////////////////////
//// ADDCOINS
////////////////////////////

if(cmd==="addcoins"){

if(!isAdmin(message.author.id))
return message.reply("Not admin");

let m = message.mentions.users.first();
let a = parseInt(args[1]);

if(!m || !a) return;

economy[m.id].wallet += a;

saveAll();

return message.reply("Added");

}

////////////////////////////
//// ADDGEMS
////////////////////////////

if(cmd==="addgems"){

if(!isAdmin(message.author.id))
return message.reply("Not admin");

let m = message.mentions.users.first();
let a = parseInt(args[1]);

if(!m || !a) return;

economy[m.id].gems += a;

saveAll();

return message.reply("Gems added");

}

////////////////////////////
//// PROFILE
////////////////////////////

if(cmd==="profile"){

let rank = "Bronze";

if(user.level>=20) rank="Silver";
if(user.level>=30) rank="Gold";
if(user.level>=40) rank="Diamond";
if(user.level>=50) rank="Mythic";

const embed = new EmbedBuilder()

.setColor("Blue")

.setThumbnail(
message.author.displayAvatarURL({dynamic:true})
)

.setDescription(`

👤 ${message.author}

Rank : ${rank}
Level : ${user.level}

💵 ${user.wallet}
🏦 ${user.bank}
💎 ${user.gems}

🐉 ${inv.selected.dragon || "None"}
⚔ ${inv.selected.weapon || "None"}
🛡 ${inv.selected.armour || "None"}

`);

return message.reply({embeds:[embed]});

}

////////////////////////////
//// RANK
////////////////////////////

if(cmd==="rank"){

let need = (user.level+1)*2500;

let bar =
"█".repeat(Math.floor(user.xp/need*10)) +
"░".repeat(10);

return message.reply(`
Level ${user.level}
XP ${bar}
`);

}

////////////////////////////
//// LEADERBOARD
////////////////////////////

if(cmd==="top"){

let sorted =
Object.entries(economy)
.sort((a,b)=>
(b[1].wallet+b[1].bank)-
(a[1].wallet+a[1].bank))
.slice(0,10);

let text="";

for(let i=0;i<sorted.length;i++){

text +=
`${i+1}. <@${sorted[i][0]}> — ${sorted[i][1].wallet}\n`;

}

const embed = new EmbedBuilder()

.setColor("Gold")
.setTitle("Top Players")
.setDescription(text);

return message.reply({embeds:[embed]});

  }
////////////////////////////
//// SHOP
////////////////////////////

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
.setTitle("🛒 SHOP")
.setDescription("Select category");

return message.reply({
embeds:[embed],
components:[row]
});

}

////////////////////////////
//// INVENTORY
////////////////////////////

if(cmd==="inv"){

const embed = new EmbedBuilder()

.setTitle("Inventory")

.setDescription(`

🐉
${inv.dragons.join("\n")||"None"}

⚔
${inv.weapons.join("\n")||"None"}

🛡
${inv.armours.join("\n")||"None"}

`);

return message.reply({embeds:[embed]});

}

////////////////////////////
//// SET
////////////////////////////

if(cmd==="set"){

let type = args[0];
let item = args[1];

if(!type || !item) return;

inv.selected[type] = item;

saveAll();

return message.reply("Selected");

}

////////////////////////////
//// UPGRADE
////////////////////////////

if(cmd==="upgrade"){

if(!inv.selected.dragon)
return message.reply("No dragon");

if(user.gems < 100)
return message.reply("Need gems");

user.gems -= 100;
inv.level += 1;

saveAll();

return message.reply("Upgraded");

  }
////////////////////////////
//// BUTTONS
////////////////////////////

client.on("interactionCreate", async interaction=>{

if(!interaction.isButton()) return;

await interaction.deferReply();

//////////////// DRAGONS

if(interaction.customId==="shop_dragons"){

const embed = new EmbedBuilder()

.setColor("Orange")

.setDescription(`

🪨 Grog 6M
🔥 Phoenix 10M
🌊 Triton 8M
⚡ Rex 9M
🌪 Zephyr 7M

`);

return interaction.editReply({embeds:[embed]});

}

//////////////// WEAPONS

if(interaction.customId==="shop_weapons"){

const embed = new EmbedBuilder()

.setColor("Orange")

.setDescription(`

🔥 FlameSword 5M
⚡ ThunderBlade 4.5M
🌊 AquaSpear 4M
🪨 StoneHammer 3.5M
🌪 WindDagger 3M

`);

return interaction.editReply({embeds:[embed]});

}

//////////////// ARMOURS

if(interaction.customId==="shop_armours"){

const embed = new EmbedBuilder()

.setColor("Orange")

.setDescription(`

🔥 DragonPlate 5M
⚡ ThunderGuard 4.5M
🌊 AquaShield 4M
🪨 EarthArmor 3.5M
🌪 ZephyrCloak 3M

`);

return interaction.editReply({embeds:[embed]});

}

});
////////////////////////////
//// CHALLENGE
////////////////////////////

if(cmd==="challenge"){

let opponent = message.mentions.users.first();
if(!opponent) return message.reply("Mention user");

if(opponent.bot) return;

battles[opponent.id] = {
challenger: message.author.id
};

return message.channel.send(
`⚔ ${opponent} challenged by ${message.author}
Type s accept`
);

}

////////////////////////////
//// ACCEPT
////////////////////////////

if(cmd==="accept"){

let data = battles[message.author.id];
if(!data) return message.reply("No challenge");

let p1 = data.challenger;
let p2 = message.author.id;

let inv1 = inventory[p1];
let inv2 = inventory[p2];

let d1 = dragons[inv1.selected.dragon] || {};
let d2 = dragons[inv2.selected.dragon] || {};

let hp1 = d1.hp || 100;
let hp2 = d2.hp || 100;

const embed = new EmbedBuilder()

.setColor("Red")

.setTitle("⚔ DRAGON BATTLE")

.setThumbnail(
message.guild.members.cache
.get(p1)
.user.displayAvatarURL({dynamic:true})
)

.addFields(

{
name:`👤 <@${p1}>`,
value:
`🐉 ${inv1.selected.dragon||"None"}
Lvl ${inv1.level}
Element ${d1.element||"None"}
⚔ ${inv1.selected.weapon||"None"}
🛡 ${inv1.selected.armour||"None"}
❤️ ${hp1}`,
inline:true
},

{
name:`👤 <@${p2}>`,
value:
`🐉 ${inv2.selected.dragon||"None"}
Lvl ${inv2.level}
Element ${d2.element||"None"}
⚔ ${inv2.selected.weapon||"None"}
🛡 ${inv2.selected.armour||"None"}
❤️ ${hp2}`,
inline:true
}

)

.setFooter({text:"Battle started"});

let msg = await message.channel.send({
embeds:[embed]
});

battles[p2] = {
p1,
p2,
hp1,
hp2,
msg:msg.id,
turn:p1,
log:[]
};

  }
////////////////////////////
//// ATTACK
////////////////////////////

if(cmd==="attack"){

let b = battles[message.author.id]
|| Object.values(battles)
.find(x=>x.p1===message.author.id);

if(!b) return;

if(b.turn !== message.author.id)
return message.reply("Not your turn");

let enemy =
message.author.id===b.p1
? b.p2
: b.p1;

let dmg =
Math.floor(Math.random()*20)+5;

if(enemy===b.p1)
b.hp1 -= dmg;
else
b.hp2 -= dmg;

b.log.push(
`<@${message.author.id}> hit ${dmg}`
);

b.turn = enemy;

let ch = message.channel;

let msg =
await ch.messages.fetch(b.msg);

const embed = new EmbedBuilder()

.setColor("Orange")

.setTitle("⚔ LIVE BATTLE")

.addFields(

{
name:`<@${b.p1}>`,
value:`❤️ ${b.hp1}`,
inline:true
},

{
name:`<@${b.p2}>`,
value:`❤️ ${b.hp2}`,
inline:true
}

)

.setDescription(
b.log.slice(-5).join("\n")
)

.setFooter({
text:`Turn: ${b.turn}`
});

await msg.edit({
embeds:[embed]
});

if(b.hp1<=0 || b.hp2<=0){

let win =
b.hp1>b.hp2 ? b.p1 : b.p2;

economy[win].wallet += 10000;

delete battles[b.p2];

return message.channel.send(
`🏆 <@${win}> won`
);

}

  }
////////////////////////////
//// LOGIN
////////////////////////////

client.login(process.env.TOKEN);
