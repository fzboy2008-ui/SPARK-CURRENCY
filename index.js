const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const dragons = require("./data/dragons");
const weapons = require("./data/weapons");
const armour = require("./data/armour");

const client = new Client({
  intents:[
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefixes = ["s","S","spark","Spark","SPARK"];

const dbFile="./database.json";

if(!fs.existsSync(dbFile)){
fs.writeFileSync(dbFile,JSON.stringify({}));
}

let db=JSON.parse(fs.readFileSync(dbFile));

function saveDB(){
fs.writeFileSync(dbFile,JSON.stringify(db,null,2));
}

function getUser(id){

if(!db[id]){

db[id]={

wallet:0,
bank:0,
gems:0,
lastDaily:0,

dragon:null,
weapon:null,
armour:null,

inventory:{
dragons:[],
weapons:[],
armours:[]
}

};

}

return db[id];

}

client.on("messageCreate", async message=>{

if(message.author.bot) return;

let prefix = prefixes.find(p => message.content.startsWith(p+" "));
if(!prefix) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

const user = getUser(message.author.id);
//////////// PROFILE ////////////

if(cmd==="profile"){

const embed=new EmbedBuilder()

.setColor("#00ffcc")

.setTitle(`👤 ${message.author.username} Profile`)

.setDescription(`

💰 Wallet : ${user.wallet}
🏦 Bank : ${user.bank}
💎 Gems : ${user.gems}

🐉 Dragon : ${user.dragon ?? "None"}
⚔ Weapon : ${user.weapon ?? "None"}
🛡 Armour : ${user.armour ?? "None"}

`);

message.reply({embeds:[embed]});

}

//////////// INVENTORY ////////////

if(cmd==="inv"){

const embed=new EmbedBuilder()

.setColor("#00ffcc")

.setTitle(`🎒 ${message.author.username} Inventory`)

.addFields(
{
name:"🐉 Dragons",
value:user.inventory.dragons.length ? user.inventory.dragons.join(", ") : "None"
},
{
name:"⚔ Weapons",
value:user.inventory.weapons.length ? user.inventory.weapons.join(", ") : "None"
},
{
name:"🛡 Armours",
value:user.inventory.armours.length ? user.inventory.armours.join(", ") : "None"
}
);

message.reply({embeds:[embed]});

}

//////////// SET EQUIPMENT ////////////

if(cmd==="set"){

const type=args[0];
const name=args.slice(1).join(" ");

if(!type) return message.reply("Usage: s set dragon/weapon/armour name");

if(type==="dragon"){

if(!user.inventory.dragons.includes(name))
return message.reply("You don't own this dragon");

user.dragon=name;

saveDB();

return message.reply(`🐉 Equipped dragon **${name}**`);

}

if(type==="weapon"){

if(!user.inventory.weapons.includes(name))
return message.reply("You don't own this weapon");

user.weapon=name;

saveDB();

return message.reply(`⚔ Equipped weapon **${name}**`);

}

if(type==="armour"){

if(!user.inventory.armours.includes(name))
return message.reply("You don't own this armour");

user.armour=name;

saveDB();

return message.reply(`🛡 Equipped armour **${name}**`);

}

  }
//////////// DRAGON SHOP ////////////

if(cmd==="dragons"){

let list="";

for(const d in dragons){
list+=`🐉 **${d}** — ${dragons[d].price}\n`;
}

const embed=new EmbedBuilder()

.setColor("#ff6600")

.setTitle("🐉 Dragon Shop")

.setDescription(list);

message.reply({embeds:[embed]});

}

//////////// BUY DRAGON ////////////

if(cmd==="buy" && args[0]==="dragon"){

const name=args.slice(1).join(" ");

if(!dragons[name]) return message.reply("Dragon not found");

const price=dragons[name].price;

if(user.wallet<price) return message.reply("Not enough coins");

if(user.inventory.dragons.includes(name))
return message.reply("You already own this dragon");

user.wallet-=price;

user.inventory.dragons.push(name);

saveDB();

message.reply(`🐉 You bought **${name}** for ${price}`);

}

//////////// WEAPON SHOP ////////////

if(cmd==="weapons"){

let list="";

for(const w in weapons){
list+=`⚔ **${w}** — ${weapons[w].price}\n`;
}

const embed=new EmbedBuilder()

.setColor("#ff0000")

.setTitle("⚔ Weapon Shop")

.setDescription(list);

message.reply({embeds:[embed]});

}

//////////// BUY WEAPON ////////////

if(cmd==="buy" && args[0]==="weapon"){

const name=args.slice(1).join(" ");

if(!weapons[name]) return message.reply("Weapon not found");

const price=weapons[name].price;

if(user.wallet<price) return message.reply("Not enough coins");

if(user.inventory.weapons.includes(name))
return message.reply("You already own this weapon");

user.wallet-=price;

user.inventory.weapons.push(name);

saveDB();

message.reply(`⚔ You bought **${name}** for ${price}`);

}

//////////// ARMOUR SHOP ////////////

if(cmd==="armours"){

let list="";

for(const a in armour){
list+=`🛡 **${a}** — ${armour[a].price}\n`;
}

const embed=new EmbedBuilder()

.setColor("#3399ff")

.setTitle("🛡 Armour Shop")

.setDescription(list);

message.reply({embeds:[embed]});

}

//////////// BUY ARMOUR ////////////

if(cmd==="buy" && args[0]==="armour"){

const name=args.slice(1).join(" ");

if(!armour[name]) return message.reply("Armour not found");

const price=armour[name].price;

if(user.wallet<price) return message.reply("Not enough coins");

if(user.inventory.armours.includes(name))
return message.reply("You already own this armour");

user.wallet-=price;

user.inventory.armours.push(name);

saveDB();

message.reply(`🛡 You bought **${name}** for ${price}`);

}
//////////// HUNT SYSTEM ////////////

if(cmd==="hunt"){

const enemies=[
{name:"Goblin",hp:30,reward:120},
{name:"Orc",hp:40,reward:180},
{name:"Skeleton",hp:35,reward:150},
{name:"Dragonling",hp:50,reward:250}
];

const enemy=enemies[Math.floor(Math.random()*enemies.length)];

let playerHP=50;

if(user.armour) playerHP+=20;

let enemyHP=enemy.hp;

const msg=await message.reply(`⚔ Hunting...\nEnemy: **${enemy.name}**`);

while(playerHP>0 && enemyHP>0){

await new Promise(r=>setTimeout(r,900));

const playerDamage=Math.floor(Math.random()*15)+5;
enemyHP-=playerDamage;

if(enemyHP<=0) break;

const enemyDamage=Math.floor(Math.random()*12)+4;
playerHP-=enemyDamage;

await msg.edit(`⚔ **Battle**

👤 HP: ${playerHP}
👾 ${enemy.name} HP: ${enemyHP}`);
}

if(playerHP>0){

user.wallet+=enemy.reward;

saveDB();

await msg.edit(`🎉 You defeated **${enemy.name}**

💰 Reward: ${enemy.reward}`);

}else{

await msg.edit(`💀 You were defeated by **${enemy.name}**`);

}

}

//////////// SIMPLE BATTLE ////////////

if(cmd==="battle"){

const target=message.mentions.users.first();

if(!target) return message.reply("Mention opponent");

const opponent=getUser(target.id);

let hp1=50;
let hp2=50;

if(user.armour) hp1+=20;
if(opponent.armour) hp2+=20;

const msg=await message.reply(`⚔ ${message.author.username} vs ${target.username}`);

while(hp1>0 && hp2>0){

await new Promise(r=>setTimeout(r,900));

const d1=Math.floor(Math.random()*15)+5;
hp2-=d1;

if(hp2<=0) break;

const d2=Math.floor(Math.random()*15)+5;
hp1-=d2;

await msg.edit(`⚔ **Battle**

${message.author.username} ❤️ ${hp1}

${target.username} ❤️ ${hp2}`);

}

if(hp1>0){

user.wallet+=200;

saveDB();

await msg.edit(`🏆 ${message.author.username} wins!

+200 coins`);

}else{

opponent.wallet+=200;

saveDB();

await msg.edit(`🏆 ${target.username} wins!

+200 coins`);

}

  }
