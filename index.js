const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefixes = ["s","S","spark","Spark","SPARK"];
const maxBet = 100000;

let economy = {};
let inventory = {};
let battles = {};

if (fs.existsSync("./economy.json"))
economy = JSON.parse(fs.readFileSync("./economy.json"));

if (fs.existsSync("./inventory.json"))
inventory = JSON.parse(fs.readFileSync("./inventory.json"));

function save(){
fs.writeFileSync("./economy.json",JSON.stringify(economy,null,2));
fs.writeFileSync("./inventory.json",JSON.stringify(inventory,null,2));
}

function time(ms){
let s = Math.floor(ms/1000)%60;
let m = Math.floor(ms/(1000*60))%60;
let h = Math.floor(ms/(1000*60*60));
return `${h}h ${m}m ${s}s`;
}

/* DATA */

const dragons = {
grog:{name:"🪨 Grog",element:"Earth",price:6000000,hp:120},
phoenix:{name:"🔥 Phoenix",element:"Fire",price:10000000,hp:130},
triton:{name:"🌊 Triton",element:"Water",price:8000000,hp:125},
rex:{name:"⚡ Rex",element:"Lightning",price:9000000,hp:128},
zephyr:{name:"🌪️ Zephyr",element:"Wind",price:7000000,hp:122}
};

const weapons = {
flamesword:{name:"🔥 Flame Sword",attack:20,price:5000000},
thunderblade:{name:"⚡ Thunder Blade",attack:18,price:4500000},
aquaspear:{name:"🌊 Aqua Spear",attack:16,price:4000000},
stonehammer:{name:"🪨 Stone Hammer",attack:15,price:3500000},
winddagger:{name:"🌪️ Wind Dagger",attack:14,price:3000000}
};

const armours = {
dragonplate:{name:"🔥 Dragon Plate",def:20,price:5000000},
thunderguard:{name:"⚡ Thunder Guard",def:18,price:4500000},
aquashield:{name:"🌊 Aqua Shield",def:16,price:4000000},
eartharmor:{name:"🪨 Earth Armor",def:15,price:3500000},
zephyrcloak:{name:"🌪️ Zephyr Cloak",def:14,price:3000000}
};

client.on("ready",()=>{
console.log("SPARK BOT V1 ONLINE");
});

client.on("messageCreate", async message => {

if(message.author.bot) return;

const prefix = prefixes.find(p => message.content.startsWith(p));
if(!prefix) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

/* USER DATA */

if(!economy[message.author.id])
economy[message.author.id]={wallet:0,bank:0,gems:0,daily:0};

if(!inventory[message.author.id])
inventory[message.author.id]={dragons:[],weapons:[],armours:[],selected:{},level:1};

let user = economy[message.author.id];
let inv = inventory[message.author.id];

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

let cd = 86400000;

if(Date.now()-user.daily < cd){

const embed = new EmbedBuilder()
.setColor("Red")
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You already claimed today's reward.

⏱ Next Daily In
${time(cd-(Date.now()-user.daily))}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

return message.reply({embeds:[embed]});
}

let reward = 1000;

user.wallet += reward;
user.daily = Date.now();

save();

const embed = new EmbedBuilder()
.setColor("Gold")
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Reward : ${reward} Coins

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

save();

return message.reply(`🏦 Deposited ${amount}`);
}

/* WITHDRAW */

if(cmd==="withdraw"){

let amount = parseInt(args[0]);

if(!amount) return;

if(user.bank < amount)
return message.reply("Not enough bank balance");

user.bank -= amount;
user.wallet += amount;

save();

return message.reply(`💵 Withdraw ${amount}`);
}

/* GIVE */

if(cmd==="give"){

let member = message.mentions.users.first();
let amount = parseInt(args[1]);

if(!member) return;

if(user.wallet < amount)
return message.reply("Not enough coins");

if(!economy[member.id])
economy[member.id]={wallet:0,bank:0,gems:0,daily:0};

economy[member.id].wallet += amount;
user.wallet -= amount;

save();

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

let reward = bet*2;
user.wallet += reward;

msg.edit(`🪙 HEADS\nYou Won ${reward}`);

}else{

msg.edit(`🔘 TAILS\nYou Lost ${bet}`);

}

save();
}

/* SLOT */

if(cmd==="slot"){

let bet=args[0];

if(bet==="all") bet=Math.min(user.wallet,maxBet);
else bet=Math.min(parseInt(bet),maxBet);

if(user.wallet<bet)
return message.reply("Not enough coins");

user.wallet-=bet;

const msg=await message.reply("🎰 Spinning...");

await new Promise(r=>setTimeout(r,1500));

let items=["💎","🍎","🥬","🅾️"];
let r=items[Math.floor(Math.random()*items.length)];

let multi={
"💎":3,
"🍎":2,
"🥬":1,
"🅾️":0
}[r];

let reward=bet*multi;

user.wallet+=reward;

msg.edit(`
🎰 SLOT

${r} ${r} ${r}

Reward : ${reward}
`);

save();

  }
/* SHOP */

if(cmd==="shop"){

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle("SHOP")
.setDescription(`
🐉 Dragons

• 🪨 Grog — 6M
• 🔥 Phoenix — 10M
• 🌊 Triton — 8M
• ⚡ Rex — 9M
• 🌪 Zephyr — 7M

⚔ Weapons

• 🔥 Flame Sword — 5M
• ⚡ Thunder Blade — 4.5M
• 🌊 Aqua Spear — 4M
• 🪨 Stone Hammer — 3.5M
• 🌪 Wind Dagger — 3M

🛡 Armours

• 🔥 Dragon Plate — 5M
• ⚡ Thunder Guard — 4.5M
• 🌊 Aqua Shield — 4M
• 🪨 Earth Armor — 3.5M
• 🌪 Zephyr Cloak — 3M

Use:
s buy <type> <item>
`);

return message.reply({embeds:[embed]});
}

/* BUY */

if(cmd==="buy"){

let type=args[0];
let item=args[1];

if(type==="dragon"){

let d=dragons[item];
if(!d) return message.reply("Dragon not found");

if(user.wallet<d.price)
return message.reply("Not enough coins");

user.wallet-=d.price;

inv.dragons.push(item);

save();

return message.reply(`🐉 Bought ${d.name}`);
}

if(type==="weapon"){

let w=weapons[item];
if(!w) return;

if(user.wallet<w.price)
return message.reply("Not enough coins");

user.wallet-=w.price;

inv.weapons.push(item);

save();

return message.reply(`⚔ Bought ${w.name}`);
}

if(type==="armour"){

let a=armours[item];
if(!a) return;

if(user.wallet<a.price)
return message.reply("Not enough coins");

user.wallet-=a.price;

inv.armours.push(item);

save();

return message.reply(`🛡 Bought ${a.name}`);
}

}

/* INVENTORY */

if(cmd==="inv"){

const embed=new EmbedBuilder()
.setColor("Blue")
.setDescription(`
📦 INVENTORY

🐉 Dragons
${inv.dragons.join("\n") || "None"}

⚔ Weapons
${inv.weapons.join("\n") || "None"}

🛡 Armours
${inv.armours.join("\n") || "None"}
`);

return message.reply({embeds:[embed]});
}

/* SET */

if(cmd==="set"){

let type=args[0];
let item=args[1];

if(!item) return;

inv.selected[type]=item;

save();

return message.reply(`✅ Selected ${type} : ${item}`);
}

/* UPGRADE */

if(cmd==="upgrade"){

let cost=100;

if(user.gems<cost)
return message.reply("Not enough gems");

user.gems-=cost;

inv.level++;

save();

return message.reply(`⬆ Dragon Level Up\nNew Level : ${inv.level}`);
}

/* CHALLENGE */

if(cmd==="challenge"){

let target=message.mentions.users.first();

if(!target) return;

battles[target.id]=message.author.id;

return message.reply(`⚔ ${target} you were challenged!
Type **s challenge accept**`);
}

/* ACCEPT */

if(cmd==="challenge" && args[0]==="accept"){

let opponent=battles[message.author.id];

if(!opponent) return message.reply("No challenge");

let p1=inventory[opponent];
let p2=inventory[message.author.id];

let d1=dragons[p1.selected.dragon];
let d2=dragons[p2.selected.dragon];

if(!d1 || !d2)
return message.reply("Both players must select dragon");

let hp1=d1.hp + p1.level*5;
let hp2=d2.hp + p2.level*5;

let max1=hp1;
let max2=hp2;

function bar(hp,max){

let total=10;
let filled=Math.round((hp/max)*total);

return "█".repeat(filled)+"░".repeat(total-filled);
}

const msg=await message.reply("⚔ Battle Starting...");

while(hp1>0 && hp2>0){

await new Promise(r=>setTimeout(r,2000));

let atk1=Math.floor(Math.random()*20)+5;
let atk2=Math.floor(Math.random()*20)+5;

hp1-=atk2;
hp2-=atk1;

const embed=new EmbedBuilder()
.setColor("Red")
.setTitle("⚔ BATTLE")
.setDescription(`
👤 ${client.users.cache.get(opponent).username}

🐉 ${d1.name}
Lvl : ${p1.level}

❤️ ${bar(hp1,max1)}

VS

👤 ${message.author.username}

🐉 ${d2.name}
Lvl : ${p2.level}

❤️ ${bar(hp2,max2)}
`);

await msg.edit({embeds:[embed]});

}

let winner = hp1>hp2 ? opponent : message.author.id;

economy[winner].gems += 25;

save();

return msg.reply(`🏆 Winner : <@${winner}>

Reward
+25 💎 Gems`);
}
  
});

client.login(process.env.TOKEN);
