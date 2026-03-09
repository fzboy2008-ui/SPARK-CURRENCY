// SPARK BOT V3 - FIXED VERSION (Railway Ready) const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js"); const fs = require("fs");

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });

const prefixes = ["s","S","spark","Spark","SPARK"];

const dbFile = "./database.json";

if(!fs.existsSync(dbFile)){ fs.writeFileSync(dbFile, JSON.stringify({})); }

let db = JSON.parse(fs.readFileSync(dbFile));

function saveDB(){ fs.writeFileSync(dbFile, JSON.stringify(db,null,2)); }

function getUser(id){

if(!db[id]){

db[id] = {
  wallet:0,
  bank:0,
  gems:0,

  xp:0,
  level:1,

  lastDaily:0,

  dragon:null,
  weapon:null,
  armour:null,

  stats:{
    wins:0,
    losses:0,
    hunts:0
  },

  inventory:{
    dragons:[],
    weapons:[],
    armours:[],
    loot:[]
  }
}

}

return db[id]; }

function addXP(user, amount){

user.xp += amount;

const needed = user.level * 200;

if(user.xp >= needed){ user.level++; user.xp = 0; return true; }

return false; }

const dragons = { Phoenix:{price:10000, atk:15}, Triton:{price:9000, atk:13}, Rex:{price:8000, atk:12}, Zephyr:{price:7000, atk:10}, Grog:{price:6000, atk:9} }

const weapons = { Sword:{price:2000, atk:5}, Katana:{price:3000, atk:7}, Axe:{price:3500, atk:8}, Hammer:{price:4000, atk:10}, Dagger:{price:1500, atk:3} }

const armour = { Leather:{price:2000, hp:10}, Iron:{price:3500, hp:20}, Steel:{price:5000, hp:30}, DragonScale:{price:8000, hp:50} }

const lootTable=[ "Ancient Coin", "Dragon Tooth", "Mystic Gem", "Broken Sword", "Golden Feather", "Magic Dust" ]

client.on("messageCreate", async message=>{

if(message.author.bot) return;

let prefix = prefixes.find(p => message.content.startsWith(p+" ")); if(!prefix) return;

const args = message.content.slice(prefix.length).trim().split(/ +/); const cmd = args.shift().toLowerCase();

const user = getUser(message.author.id);

//////////////// HELP //////////////////

if(cmd==="help"){

const embed=new EmbedBuilder() .setColor("#ffaa00") .setTitle("⚡ SPARK BOT COMMANDS") .setDescription(`

💰 Economy s bal s daily

🎒 RPG s profile s inv s dragons s buy

⚔ Battle s hunt s battle

🏆 Other s leaderboard

`)

message.reply({embeds:[embed]})

}

//////////////// BAL //////////////////

if(cmd==="bal"){

const embed=new EmbedBuilder() .setColor("#00ff88") .setTitle("💰 Balance") .setDescription(Wallet: ${user.wallet}\nBank: ${user.bank}\nGems: ${user.gems}\nLevel: ${user.level}\nXP: ${user.xp})

message.reply({embeds:[embed]})

}

//////////////// DAILY //////////////////

if(cmd==="daily"){

const now=Date.now(); const cd=86400000;

if(now-user.lastDaily<cd){ return message.reply("Daily already claimed"); }

const reward=500;

user.wallet+=reward; user.lastDaily=now;

saveDB();

message.reply(🎁 You received ${reward})

}

//////////////// PROFILE //////////////////

if(cmd==="profile"){

const embed=new EmbedBuilder() .setColor("#00ffee") .setTitle(${message.author.username} Profile) .setDescription(Level: ${user.level}\nXP: ${user.xp}\n\nDragon: ${user.dragon ?? "None"}\nWeapon: ${user.weapon ?? "None"}\nArmour: ${user.armour ?? "None"}\n\nWins: ${user.stats.wins}\nLosses: ${user.stats.losses}\nHunts: ${user.stats.hunts})

message.reply({embeds:[embed]})

}

//////////////// INVENTORY //////////////////

if(cmd==="inv"){

const embed=new EmbedBuilder() .setColor("#00ffaa") .setTitle("Inventory") .addFields( { name:"Dragons", value:user.inventory.dragons.join(", ") || "None" }, { name:"Weapons", value:user.inventory.weapons.join(", ") || "None" }, { name:"Armours", value:user.inventory.armours.join(", ") || "None" }, { name:"Loot", value:user.inventory.loot.join(", ") || "None" } )

message.reply({embeds:[embed]})

}

//////////////// DRAGONS //////////////////

if(cmd==="dragons"){

let list="";

for(const d in dragons){ list += ${d} - ${dragons[d].price}\n }

message.reply(list)

}

//////////////// BUY //////////////////

if(cmd==="buy"){

const type=args[0] const name=args[1]

if(type==="dragon"){

if(!dragons[name]) return message.reply("Dragon not found")

const price=dragons[name].price

if(user.wallet<price) return message.reply("Not enough coins")

user.wallet-=price

user.inventory.dragons.push(name)

saveDB()

return message.reply(Bought ${name})

}

}

//////////////// HUNT //////////////////

if(cmd==="hunt"){

user.stats.hunts++

let playerHP=50

if(user.armour){ playerHP+=armour[user.armour].hp }

let enemyHP=40

while(playerHP>0 && enemyHP>0){ playerHP-=Math.floor(Math.random()*10) enemyHP-=Math.floor(Math.random()*12) }

if(playerHP>0){

user.wallet+=200

const loot=lootTable[Math.floor(Math.random()*lootTable.length)]

user.inventory.loot.push(loot)

const levelUp=addXP(user,50)

saveDB()

message.reply(Victory! Loot: ${loot}${levelUp ? "\nLEVEL UP!" : ""})

}else{

message.reply("You lost the hunt")

}

}

//////////////// BATTLE //////////////////

if(cmd==="battle"){

const target=message.mentions.users.first()

if(!target) return message.reply("Mention opponent")

const opponent=getUser(target.id)

let hp1=60 let hp2=60

while(hp1>0 && hp2>0){ hp1-=Math.floor(Math.random()*12) hp2-=Math.floor(Math.random()*12) }

if(hp1>0){

user.wallet+=300 user.stats.wins++

saveDB()

message.reply("You won the duel")

}else{

user.stats.losses++

saveDB()

message.reply("You lost")

}

}

//////////////// LEADERBOARD //////////////////

if(cmd==="leaderboard"){

const top=Object.entries(db) .sort((a,b)=>b[1].wallet-a[1].wallet) .slice(0,10) .map((u,i)=>${i+1}. <@${u[0]}> - ${u[1].wallet}) .join("\n")

message.reply(🏆 Leaderboard\n${top})

}

});

client.once("ready",()=>{ console.log(Logged in as ${client.user.tag}) })

client.login(process.env.TOKEN)
