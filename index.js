const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const prefix = "s";
const dbFile = "./database.json";

if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(dbFile, JSON.stringify({}));
}

let db = JSON.parse(fs.readFileSync(dbFile));

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

function getUser(id) {
  if (!db[id]) {
    db[id] = {
      wallet: 0,
      bank: 0,
      gems: 0,
      lastDaily: 0
    };
  }
  return db[id];
}

client.on("messageCreate", async (message) => {

if (message.author.bot) return;
if (!message.content.startsWith(prefix)) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

const user = getUser(message.author.id);

//////////////// HELP //////////////////

if (cmd === "help") {

const embed = new EmbedBuilder()
.setColor("#f1c40f")
.setTitle("⚡ SPARK BOT COMMANDS")
.setDescription(`
💰 **ECONOMY**
\`s bal\`
\`s daily\`
\`s deposit <amount>\`
\`s withdraw <amount>\`

🎰 **CASINO**
\`s cf <amount/all>\`
\`s slot <amount/all>\`

👤 **PLAYER**
\`s profile\`
\`s rank\`

🛒 **RPG**
\`s shop\`
\`s buy <type> <item>\`
\`s inv\`
\`s set <type> <item>\`
\`s upgrade\`
`);

message.reply({ embeds:[embed] });

}

//////////////// BAL //////////////////

if (cmd === "bal") {

const embed = new EmbedBuilder()
.setColor("#f1c40f")
.setTitle("💰 BALANCE")
.setDescription(`
👤 **${message.author.username}**

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}
`);

message.reply({ embeds:[embed] });

}

//////////////// DAILY //////////////////

if (cmd === "daily") {

const now = Date.now();
const cooldown = 86400000;

if (now - user.lastDaily < cooldown) {

const timeLeft = cooldown - (now - user.lastDaily);
const hours = Math.floor(timeLeft / 3600000);

const embed = new EmbedBuilder()
.setColor("Red")
.setDescription(`
You already claimed today's reward.

⏱ Next Daily In **${hours}h**
`);

return message.reply({embeds:[embed]});

}

const reward = 500;

user.wallet += reward;
user.lastDaily = now;

saveDB();

const embed = new EmbedBuilder()
.setColor("Green")
.setDescription(`
🎉 Daily Reward Claimed

💰 +${reward} coins added to wallet
`);

message.reply({embeds:[embed]});

}

//////////////// COINFLIP //////////////////

if (cmd === "cf") {

let amount = args[0];

if (!amount) return;

if (amount === "all") amount = user.wallet;

amount = parseInt(amount);

if (user.wallet < amount) {
return message.reply("Not enough coins.");
}

const win = Math.random() < 0.5;

if (win) {
user.wallet += amount;
} else {
user.wallet -= amount;
}

saveDB();

const embed = new EmbedBuilder()
.setColor(win ? "Green" : "Red")
.setTitle("🪙 COIN FLIP")
.setDescription(
win
? `You **won ${amount} coins**`
: `You **lost ${amount} coins**`
);

message.reply({embeds:[embed]});

}

//////////////// SLOT //////////////////

if (cmd === "slot") {

let amount = args[0];

if (!amount) return;

if (amount === "all") amount = user.wallet;

amount = parseInt(amount);

if (user.wallet < amount) {
return message.reply("Not enough coins.");
}

const roll = Math.random();

let result;

if (roll > 0.7) {
const win = amount * 2;
user.wallet += win;
result = `🎰 JACKPOT! You won ${win}`;
} else {
user.wallet -= amount;
result = `🎰 You lost ${amount}`;
}

saveDB();

const embed = new EmbedBuilder()
.setColor("#9b59b6")
.setTitle("🎰 SLOT MACHINE")
.setDescription(result);

message.reply({embeds:[embed]});

}

});

client.once("ready", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
