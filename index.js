const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
 intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
});

const prefix = "s ";

/* DATABASE */

if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json","{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function save() {
 fs.writeFileSync("./database/users.json",JSON.stringify(users,null,2));
}

function getUser(id){

 if(!users[id]){

 users[id]={
 wallet:1000,
 bank:0,
 gems:0,

 xp:0,
 level:1,

 dragon:null,

 inventory:{
  dragons:[],
  weapons:[],
  armours:[]
 },

 lastDaily:0,

 wins:0,
 loses:0
 };

 }

 return users[id];

}

/* READY */

client.once("ready",()=>{

console.log("⚡ Spark Bot Online");

});

/* XP SYSTEM */

client.on("messageCreate", async msg => {

if(msg.author.bot) return;

let user = getUser(msg.author.id);

user.xp += 1;

let needed = user.level * 2500;

if(user.xp >= needed){

user.xp = 0;
user.level += 1;

let reward = user.level * 5000;

user.wallet += reward;

msg.channel.send(`
🏆 **LEVEL UP**

${msg.author}

New Level: ${user.level}

Reward: ${reward} coins
`);

}

save();

});

/* COMMANDS */

client.on("messageCreate", async msg => {

if(msg.author.bot) return;
if(!msg.content.startsWith(prefix)) return;

const args = msg.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

let user = getUser(msg.author.id);

/* HELP */

if(cmd==="help"){

msg.reply(`
⚡ **SPARK BOT COMMANDS**

💰 Economy
s bal
s deposit
s withdraw
s give

🎁 Rewards
s daily

👤 Profile
s profile
s lvl
s inv

🎮 Games
s cf
s slot

⚔ Battle
s challenge

🏆 Leaderboard
s lb
`);

}

/* BALANCE */

if(cmd==="bal"){

msg.reply(`
💰 **${msg.author.username} Balance**

👛 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
`);

}

/* DEPOSIT */

if(cmd==="deposit"){

let amount = args[0];

if(amount==="all") amount = user.wallet;

amount = parseInt(amount);

if(!amount || amount<=0) return msg.reply("Enter valid amount");

if(amount > user.wallet) return msg.reply("Not enough wallet coins");

user.wallet -= amount;
user.bank += amount;

save();

msg.reply(`🏦 Deposited ${amount} coins`);

}

/* WITHDRAW */

if(cmd==="withdraw"){

let amount = args[0];

if(amount==="all") amount = user.bank;

amount = parseInt(amount);

if(!amount || amount<=0) return msg.reply("Enter valid amount");

if(amount > user.bank) return msg.reply("Not enough bank coins");

user.bank -= amount;
user.wallet += amount;

save();

msg.reply(`👛 Withdrawn ${amount} coins`);

}

/* GIVE */

if(cmd==="give"){

let target = msg.mentions.users.first();

let amount = parseInt(args[1]);

if(!target) return msg.reply("Mention user");

if(!amount || amount<=0) return msg.reply("Enter amount");

if(amount > user.wallet) return msg.reply("Not enough coins");

let targetUser = getUser(target.id);

user.wallet -= amount;
targetUser.wallet += amount;

save();

msg.reply(`💸 Sent ${amount} coins to ${target.username}`);

}

/* DAILY */

if(cmd==="daily"){

let now = Date.now();

if(now - user.lastDaily < 86400000){

return msg.reply("⏳ You already claimed daily reward");

}

user.wallet += 500;

user.lastDaily = now;

save();

msg.reply(`
🎁 **DAILY REWARD**

You received 500 coins
`);

}

/* LEVEL */

if(cmd==="lvl"){

let needed = user.level * 2500;

msg.reply(`
🏅 **LEVEL**

Level: ${user.level}

XP: ${user.xp}/${needed}
`);

}

/* PROFILE */

if(cmd==="profile" || cmd==="p"){

msg.reply(`
👤 **PROFILE**

Name: ${msg.author.username}

🏅 Level: ${user.level}

XP: ${user.xp}

🐉 Dragon: ${user.dragon ? user.dragon : "None"}

⚔ Wins: ${user.wins}
💀 Loses: ${user.loses}
`);

}

/* INVENTORY */

if(cmd==="inv"){

msg.reply(`
🎒 **INVENTORY**

🐉 Dragons: ${user.inventory.dragons.join(", ") || "None"}

🛡 Armours: ${user.inventory.armours.join(", ") || "None"}

⚔ Weapons: ${user.inventory.weapons.join(", ") || "None"}
`);

}

});
/* COINFLIP */

if(cmd==="cf" || cmd==="coinflip"){

let bet = args[0];

if(bet==="all") bet = user.wallet;

bet = parseInt(bet);

if(!bet || bet<=0) return msg.reply("Enter bet");

if(bet>200000) bet=200000;

if(bet>user.wallet) return msg.reply("Not enough coins");

msg.reply("🪙 Flipping coin...");

setTimeout(()=>{

let win = Math.random() < 0.20;

if(win){

let reward = bet*2;

user.wallet += reward;

msg.channel.send(`
🪙 **COINFLIP RESULT**

✨ YOU WON

Bet: ${bet}
Won: ${reward}
`);

}else{

user.wallet -= bet;

msg.channel.send(`
🪙 **COINFLIP RESULT**

💀 YOU LOST

Lost: ${bet}
`);

}

save();

},3000)

}


/* SLOT MACHINE */

if(cmd==="slot"){

let bet = args[0];

if(bet==="all") bet=user.wallet;

bet=parseInt(bet);

if(!bet || bet<=0) return msg.reply("Enter bet");

if(bet>200000) bet=200000;

if(bet>user.wallet) return msg.reply("Not enough coins");

const symbols=["💎","🥭","🍉"];

msg.reply("🎰 Spinning...");

setTimeout(()=>{

let s1=symbols[Math.floor(Math.random()*3)];
let s2=symbols[Math.floor(Math.random()*3)];
let s3=symbols[Math.floor(Math.random()*3)];

let result="";
let reward=0;

if(s1==="💎" && s2==="💎" && s3==="💎"){

reward=bet*3;
user.wallet+=reward;

result=`
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

💎 JACKPOT
Won: ${reward}
`

}

else if(s1==="🥭" && s2==="🥭" && s3==="🥭"){

reward=bet*2;
user.wallet+=reward;

result=`
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

🥭 WIN
Won: ${reward}
`

}

else if(s1==="🍉" && s2==="🍉" && s3==="🍉"){

result=`
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

🍉 TIE
Bet Returned
`

}

else{

user.wallet-=bet;

result=`
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

💀 LOSE
Lost: ${bet}
`

}

msg.channel.send(result)

save()

},4000)

}


/* SHOP */

if(cmd==="shop"){

msg.reply(`
🛒 **SHOP**

1️⃣ Dragons
2️⃣ Weapons
3️⃣ Armours

Use:
s dragons
s weapons
s armours
`)

}


/* DRAGONS */

if(cmd==="dragons"){

msg.reply(`
🐉 **DRAGON SHOP**

🔥 Fire Dragon — 4,000,000
⚡ Lightning Dragon — 6,000,000
🌪 Wind Dragon — 7,000,000
❄ Ice Dragon — 9,000,000

Buy using:
s buy dragon fire
`)

}


/* WEAPONS */

if(cmd==="weapons"){

msg.reply(`
⚔ **WEAPON SHOP**

🔥 Fire Sword — 1,000,000
⚡ Lightning Blade — 1,000,000
🌪 Wind Katana — 1,000,000
❄ Ice Spear — 1,000,000
`)

}


/* ARMOURS */

if(cmd==="armours"){

msg.reply(`
🛡 **ARMOUR SHOP**

🔥 Fire Armour — 500,000
⚡ Lightning Armour — 500,000
🌪 Wind Armour — 500,000
❄ Ice Armour — 500,000
`)

}


/* BUY SYSTEM */

if(cmd==="buy"){

let type=args[0];
let name=args[1];

if(type==="dragon"){

let price=4000000;

if(user.wallet<price) return msg.reply("Not enough coins");

user.wallet-=price;

user.inventory.dragons.push(name);

save()

msg.reply(`🐉 Bought ${name} dragon`)

}

}


/* SET DRAGON */

if(cmd==="set"){

let dragon=args[0];

if(!user.inventory.dragons.includes(dragon)) return msg.reply("You don't own this dragon");

user.dragon=dragon;

save()

msg.reply(`🐉 Dragon set to ${dragon}`)

}


/* FEED DRAGON */

if(cmd==="feed"){

if(!user.dragon) return msg.reply("No dragon selected");

if(user.gems<100) return msg.reply("Need 100 gems");

user.gems-=100;

msg.reply(`🐉 ${user.dragon} leveled up`)

save()

}


/* LEADERBOARD COINS */

if(cmd==="lb" && args[0]==="c"){

let sorted=Object.entries(users)
.sort((a,b)=> (b[1].wallet+b[1].bank) - (a[1].wallet+a[1].bank))
.slice(0,10)

let text="🏆 COIN LEADERBOARD\n\n"

for(let i=0;i<sorted.length;i++){

let id=sorted[i][0]
let data=sorted[i][1]

text+=`${i+1}. <@${id}> — ${data.wallet+data.bank}\n`

}

msg.channel.send(text)

}


/* LEADERBOARD BATTLES */

if(cmd==="lb" && args[0]==="b"){

let sorted=Object.entries(users)
.sort((a,b)=> b[1].wins-a[1].wins)
.slice(0,10)

let text="⚔ BATTLE LEADERBOARD\n\n"

for(let i=0;i<sorted.length;i++){

let id=sorted[i][0]
let data=sorted[i][1]

text+=`${i+1}. <@${id}> — ${data.wins} wins\n`

}

msg.channel.send(text)

}


/* BATTLE */

if(cmd==="challenge"){

let opponent=msg.mentions.users.first()

if(!opponent) return msg.reply("Mention user")

msg.channel.send(`
⚔ **BATTLE CHALLENGE**

${msg.author.username} challenged ${opponent.username}

Type:
s accept
`)

}

if(cmd==="accept"){

msg.channel.send("⚔ Battle starting...")

setTimeout(()=>{

let players=[...msg.channel.members.values()]
let winner=players[Math.floor(Math.random()*players.length)]

msg.channel.send(`
🏆 **BATTLE RESULT**

Winner: ${winner.user.username}

Reward: 10 gems
`)

},5000)

   }

client.login(process.env.TOKEN);
