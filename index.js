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

//////////////// PREFIX

const prefixes = ["s","S","spark","Spark","SPARK"];

//////////////// DATABASE

let economy = {};
let inventory = {};
let admins = [];
let battles = {};

//////////////// LOAD

function loadJSON(path, def){

if(!fs.existsSync(path)){
fs.writeFileSync(path, JSON.stringify(def,null,2));
return def;
}

return JSON.parse(fs.readFileSync(path));

}

economy = loadJSON("./economy.json",{});
inventory = loadJSON("./inventory.json",{});
admins = loadJSON("./admins.json",[]);

//////////////// SAVE

function saveAll(){

fs.writeFileSync("./economy.json",JSON.stringify(economy,null,2));
fs.writeFileSync("./inventory.json",JSON.stringify(inventory,null,2));
fs.writeFileSync("./admins.json",JSON.stringify(admins,null,2));

}

//////////////// ADMIN

function isAdmin(id){
return admins.includes(id);
}

//////////////// ELEMENT BONUS

const elementBonus = {

Fire:"Wind",
Wind:"Earth",
Earth:"Lightning",
Lightning:"Water",
Water:"Fire"

};

function getElementBonus(a,b){

if(elementBonus[a]===b) return 5;

return 0;

}

//////////////// DRAGONS

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
name:"🌪 Zephyr",
element:"Wind",
price:7000000,
hp:122
}

};

//////////////// WEAPONS

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
name:"🌪 Wind Dagger",
attack:14,
price:3000000
}

};

//////////////// ARMOURS

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
name:"🌪 Zephyr Cloak",
def:14,
price:3000000
}

};

//////////////// CREATE USER

function createUser(id){

if(!economy[id]){

economy[id]={
wallet:0,
bank:0,
gems:0,
daily:0,
xp:0,
level:1,
wins:0
};

}

if(!inventory[id]){

inventory[id]={
dragons:[],
weapons:[],
armours:[],
selected:{
dragon:null,
weapon:null,
armour:null
},
level:1
};

}

}

//////////////// READY

client.on("ready",()=>{

console.log("🔥 SPARK ULTRA V5 ONLINE");

});
//////////////// MESSAGE

client.on("messageCreate", async message => {

if(message.author.bot) return;

const prefix = prefixes.find(p =>
message.content.startsWith(p)
);

if(!prefix) return;

const args =
message.content
.slice(prefix.length)
.trim()
.split(/ +/);

const cmd =
args.shift().toLowerCase();

createUser(message.author.id);

let user =
economy[message.author.id];

let inv =
inventory[message.author.id];

//////////////// XP

user.xp += 1;

let need =
(user.level+1)*2500;

if(user.xp >= need){

user.xp = 0;
user.level++;

user.wallet +=
user.level * 1000;

}

//////////////// BAL

if(cmd==="bal"){

const embed =
new EmbedBuilder()

.setTitle("Balance")

.setDescription(`

Wallet: ${user.wallet}
Bank: ${user.bank}
Gems: ${user.gems}

`);

return message.reply({
embeds:[embed]
});

}

//////////////// DAILY

if(cmd==="daily"){

let cd = 86400000;

if(Date.now()-user.daily < cd)
return message.reply("Wait");

let r = 1000;

user.wallet += r;
user.daily = Date.now();

saveAll();

return message.reply(
`Daily ${r}`
);

}

//////////////// DEPOSIT

if(cmd==="deposit"){

let a = parseInt(args[0]);

if(!a) return;

if(user.wallet < a)
return;

user.wallet -= a;
user.bank += a;

saveAll();

return message.reply("Done");

}

//////////////// WITHDRAW

if(cmd==="withdraw"){

let a = parseInt(args[0]);

if(!a) return;

if(user.bank < a)
return;

user.bank -= a;
user.wallet += a;

saveAll();

return message.reply("Done");

}

//////////////// GIVE

if(cmd==="give"){

let m =
message.mentions.users.first();

let a =
parseInt(args[1]);

if(!m) return;

createUser(m.id);

if(user.wallet < a)
return;

user.wallet -= a;

economy[m.id].wallet += a;

saveAll();

return message.reply("Sent");

}

//////////////// PROFILE

if(cmd==="profile"){

let need =
(user.level+1)*2500;

let bar =
Math.floor(
(user.xp/need)*10
);

let xpbar =
"█".repeat(bar) +
"░".repeat(10-bar);

const embed =
new EmbedBuilder()

.setTitle("Profile")

.setDescription(`

Level: ${user.level}

XP
${xpbar}

Wallet: ${user.wallet}
Bank: ${user.bank}

Dragon:
${inv.selected.dragon || "None"}

Weapon:
${inv.selected.weapon || "None"}

Armour:
${inv.selected.armour || "None"}

Wins:
${user.wins}

`);

return message.reply({
embeds:[embed]
});

}

//////////////// RANK

if(cmd==="rank"){

let need =
(user.level+1)*2500;

let bar =
Math.floor(
(user.xp/need)*10
);

let xpbar =
"█".repeat(bar) +
"░".repeat(10-bar);

return message.reply(`

Level ${user.level}

${xpbar}

`);

}

//////////////// LB

if(cmd==="lb"){

let type = args[0];

let arr =
Object.keys(economy)
.map(id=>({

id,
wallet:
economy[id].wallet,

wins:
economy[id].wins||0

}));

if(type==="balance"){

arr.sort(
(a,b)=>
b.wallet-a.wallet
);

let t="";

for(let i=0;i<5;i++){

if(!arr[i]) break;

t +=
`${i+1}.
<@${arr[i].id}>
${arr[i].wallet}\n`;

}

return message.reply(t);

}

if(type==="battles"){

arr.sort(
(a,b)=>
b.wins-a.wins
);

let t="";

for(let i=0;i<5;i++){

if(!arr[i]) break;

t +=
`${i+1}.
<@${arr[i].id}>
${arr[i].wins}\n`;

}

return message.reply(t);

}

  }
//////////////// SHOP

if(cmd==="shop"){

const row =
new ActionRowBuilder()
.addComponents(

new ButtonBuilder()
.setCustomId("shop_dragons")
.setLabel("Dragons")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_weapons")
.setLabel("Weapons")
.setStyle(ButtonStyle.Primary),

new ButtonBuilder()
.setCustomId("shop_armours")
.setLabel("Armours")
.setStyle(ButtonStyle.Primary)

);

return message.reply({

content:"SHOP",

components:[row]

});

}

//////////////// INVENTORY

if(cmd==="inv"){

const embed =
new EmbedBuilder()

.setTitle("Inventory")

.setDescription(`

Dragons
${inv.dragons.join("\n") || "None"}

Weapons
${inv.weapons.join("\n") || "None"}

Armours
${inv.armours.join("\n") || "None"}

Selected

${inv.selected.dragon}
${inv.selected.weapon}
${inv.selected.armour}

Level
${inv.level}

`);

return message.reply({
embeds:[embed]
});

}

//////////////// BUY

if(cmd==="buy"){

let name =
args[0];

if(!name) return;

let item =
dragons[name] ||
weapons[name] ||
armours[name];

if(!item)
return message.reply("No item");

if(user.wallet <
item.price)
return;

user.wallet -=
item.price;

if(dragons[name])
inv.dragons.push(name);

if(weapons[name])
inv.weapons.push(name);

if(armours[name])
inv.armours.push(name);

saveAll();

return message.reply(
"Bought"
);

}

//////////////// SET

if(cmd==="set"){

let type =
args[0];

let item =
args[1];

if(!type || !item)
return;

inv.selected[type] =
item;

saveAll();

return message.reply(
"Selected"
);

}

//////////////// UPGRADE

if(cmd==="upgrade"){

if(!inv.selected.dragon)
return;

if(user.gems < 100)
return;

user.gems -= 100;

inv.level++;

saveAll();

return message.reply(
"Upgraded"
);

  }
//////////////// CHALLENGE

if(cmd==="challenge"){

let enemy =
message.mentions.users.first();

if(!enemy)
return message.reply("Mention");

createUser(enemy.id);

battles[message.author.id] = {
enemy: enemy.id
};

return message.reply(
"Challenge sent"
);

}

//////////////// ACCEPT

if(cmd==="accept"){

let enemy =
message.mentions.users.first();

if(!enemy) return;

if(!battles[enemy.id])
return message.reply(
"No challenge"
);

if(
battles[enemy.id].enemy
!== message.author.id
) return;

let p1 = enemy.id;
let p2 = message.author.id;

let d1 =
inventory[p1].selected.dragon;

let d2 =
inventory[p2].selected.dragon;

if(!d1 || !d2)
return message.reply(
"Need dragon"
);

battles[p1] = {

p1,
p2,

hp1:
dragons[d1].hp,

hp2:
dragons[d2].hp,

turn:p1,

log:"Fight start"

};

battles[p2] =
battles[p1];

return message.reply(`

Fight start

HP1 ${battles[p1].hp1}
HP2 ${battles[p1].hp2}

Turn <@${p1}>

`);

}

//////////////// ATTACK

if(cmd==="attack"){

let b =
battles[message.author.id];

if(!b)
return message.reply(
"No battle"
);

if(b.turn !==
message.author.id)
return message.reply(
"Wait turn"
);

let me =
message.author.id;

let enemy =
me === b.p1
? b.p2
: b.p1;

let myInv =
inventory[me];

let enInv =
inventory[enemy];

let myDragon =
myInv.selected.dragon;

let enDragon =
enInv.selected.dragon;

let myWeapon =
myInv.selected.weapon;

let enArmour =
enInv.selected.armour;

let atk =
weapons[myWeapon]
?.attack || 5;

let def =
armours[enArmour]
?.def || 0;

let bonus =
getElementBonus(
dragons[myDragon].element,
dragons[enDragon].element
);

let lvl =
myInv.level;

let dmg =
Math.max(
1,
atk - def +
bonus + lvl
);

if(me === b.p1){

b.hp2 -= dmg;

}else{

b.hp1 -= dmg;

}

b.turn = enemy;

b.log =
`${message.author.username}
did ${dmg}`;

if(
b.hp1 <= 0 ||
b.hp2 <= 0
){

let win =
b.hp1 <= 0
? b.p2
: b.p1;

economy[win].wallet += 10000;
economy[win].wins += 1;

delete battles[b.p1];
delete battles[b.p2];

saveAll();

return message.reply(
`Winner <@${win}>`
);

}

return message.reply(`

HP1 ${b.hp1}
HP2 ${b.hp2}

${b.log}

Turn <@${b.turn}>

`);

}
//////////////// MESSAGE END

});

//////////////// BUTTONS

client.on(
"interactionCreate",
async interaction=>{

if(!interaction.isButton())
return;

await interaction.deferReply();

if(
interaction.customId
==="shop_dragons"
){

return interaction.editReply(
Object.keys(dragons)
.join("\n")
);

}

if(
interaction.customId
==="shop_weapons"
){

return interaction.editReply(
Object.keys(weapons)
.join("\n")
);

}

if(
interaction.customId
==="shop_armours"
){

return interaction.editReply(
Object.keys(armours)
.join("\n")
);

}

});

//////////////// AUTO SAVE

setInterval(()=>{

saveAll();

},30000);

//////////////// SAFE SAVE

process.on(
"SIGINT",
()=>{

saveAll();
process.exit();

});

process.on(
"SIGTERM",
()=>{

saveAll();
process.exit();

});

//////////////// LOGIN

client.login(
process.env.TOKEN
);
