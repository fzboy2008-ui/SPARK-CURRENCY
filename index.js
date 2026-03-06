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

if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json", "{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function save() {
 fs.writeFileSync("./database/users.json", JSON.stringify(users,null,2));
}

function getUser(id) {
 if (!users[id]) {
  users[id] = {
   coins: 10000,
   wins: 0,
   loses: 0
  };
 }
 return users[id];
}

client.once("ready", () => {
 console.log("Spark Bot Online");
});

client.on("messageCreate", async (msg) => {

 if (msg.author.bot) return;
 if (!msg.content.startsWith(prefix)) return;

 const args = msg.content.slice(prefix.length).trim().split(/ +/);
 const cmd = args.shift().toLowerCase();

 const user = getUser(msg.author.id);





/* HELP COMMAND */

if (cmd === "help") {

msg.reply(`
⚡ **SPARK BOT COMMANDS**

💰 Economy
s bal
s cf <amount>
s slot <amount>

⚔ Battle
s battle @user <amount>

🏆 Leaderboard
s lb c
s lb b
`);

}





/* BALANCE */

if (cmd === "bal") {

msg.reply(`
💰 **${msg.author.username} Balance**

🪙 Coins: ${user.coins}
`);

}





/* COINFLIP */

if (cmd === "cf") {

let bet = parseInt(args[0]);

if (!bet || bet <= 0) return msg.reply("Enter bet amount");

if (bet > user.coins) return msg.reply("Not enough coins");

msg.reply("🪙 Flipping coin...");

setTimeout(() => {

let win = Math.random() < 0.5;

if (win) {

user.coins += bet;

msg.channel.send(`
🪙 **COINFLIP RESULT**

✨ You Won!

+${bet} coins
`);

} else {

user.coins -= bet;

msg.channel.send(`
🪙 **COINFLIP RESULT**

💀 You Lost

-${bet} coins
`);

}

save();

},2000);

}





/* SLOT MACHINE */

if (cmd === "slot") {

let bet = parseInt(args[0]);

if (!bet || bet <= 0) return msg.reply("Enter bet");

if (bet > user.coins) return msg.reply("Not enough coins");

const symbols = ["💎","🥭","🍉"];

msg.reply("🎰 Spinning...");

setTimeout(() => {

let s1 = symbols[Math.floor(Math.random()*3)];
let s2 = symbols[Math.floor(Math.random()*3)];
let s3 = symbols[Math.floor(Math.random()*3)];

let result = "";
let reward = 0;

if (s1==="💎" && s2==="💎" && s3==="💎") {

reward = bet*3;
user.coins += reward;

result = `
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

💎 JACKPOT
🏆 Won: ${reward}
`;

}

else if (s1==="🥭" && s2==="🥭" && s3==="🥭") {

reward = bet*2;
user.coins += reward;

result = `
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

🥭 WIN
🏆 Won: ${reward}
`;

}

else if (s1==="🍉" && s2==="🍉" && s3==="🍉") {

result = `
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

🍉 TIE
Bet returned
`;

}

else {

user.coins -= bet;

result = `
🎰 SLOT RESULT

| ${s1} | ${s2} | ${s3} |

💀 YOU LOST
Lost: ${bet}
`;

}

msg.channel.send(result);

save();

},3000);

}





/* LEADERBOARD COINS */

if (cmd === "lb" && args[0] === "c") {

let sorted = Object.entries(users)
.sort((a,b)=>b[1].coins-a[1].coins)
.slice(0,10);

let text = "🏆 **COIN LEADERBOARD**\n\n";

for (let i=0;i<sorted.length;i++) {

let id = sorted[i][0];
let data = sorted[i][1];

text += `${i+1}. <@${id}> — ${data.coins} coins\n`;

}

msg.channel.send(text);

}





/* LEADERBOARD BATTLES */

if (cmd === "lb" && args[0] === "b") {

let sorted = Object.entries(users)
.sort((a,b)=>b[1].wins-a[1].wins)
.slice(0,10);

let text = "⚔ **BATTLE LEADERBOARD**\n\n";

for (let i=0;i<sorted.length;i++) {

let id = sorted[i][0];
let data = sorted[i][1];

text += `${i+1}. <@${id}> — ${data.wins} wins\n`;

}

msg.channel.send(text);

}





/* BATTLE */

if (cmd === "battle") {

let opponent = msg.mentions.users.first();
let bet = parseInt(args[1]);

if (!opponent) return msg.reply("Mention opponent");

if (!bet) return msg.reply("Enter bet");

let opp = getUser(opponent.id);

msg.channel.send(`
⚔ **BATTLE STARTED**

${msg.author.username} VS ${opponent.username}

Bet: ${bet}
`);

setTimeout(()=>{

let winner = Math.random() < 0.5 ? msg.author : opponent;

if (winner.id === msg.author.id) {

user.coins += bet;
opp.coins -= bet;
user.wins++;

} else {

opp.coins += bet;
user.coins -= bet;
opp.wins++;

}

msg.channel.send(`
🏆 **BATTLE RESULT**

Winner: ${winner.username}

💰 Prize: ${bet}
`);

save();

},5000);

}

});

client.login("YOUR_BOT_TOKEN");
