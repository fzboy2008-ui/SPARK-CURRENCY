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

/* MAIN EVENT */

client.on("messageCreate", async msg => {

if(msg.author.bot) return;

/* XP SYSTEM */

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

/* COMMAND CHECK */

if(!msg.content.startsWith(prefix)) return;

const args = msg.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

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
s lb c
s lb b
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

let win = Math.random() < 0.5;

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

/* SLOT */

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

let reward=0;

if(s1==="💎" && s2==="💎" && s3==="💎"){

reward=bet*3;
user.wallet+=reward;

msg.channel.send(`🎰 | ${s1} | ${s2} | ${s3} |\n💎 JACKPOT\nWon ${reward}`);

}

else if(s1==="🥭" && s2==="🥭" && s3==="🥭"){

reward=bet*2;
user.wallet+=reward;

msg.channel.send(`🎰 | ${s1} | ${s2} | ${s3} |\n🥭 WIN\nWon ${reward}`);

}

else if(s1==="🍉" && s2==="🍉" && s3==="🍉"){

msg.channel.send(`🎰 | ${s1} | ${s2} | ${s3} |\n🍉 TIE\nBet returned`);

}

else{

user.wallet-=bet;

msg.channel.send(`🎰 | ${s1} | ${s2} | ${s3} |\n💀 LOSE\nLost ${bet}`);

}

save()

},4000)

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

});

/* LOGIN */

client.login(process.env.TOKEN);
