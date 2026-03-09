const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]});

const prefix = "s";

const dbFile = "./database.json";

if(!fs.existsSync(dbFile)){
fs.writeFileSync(dbFile, JSON.stringify({}));
}

let db = JSON.parse(fs.readFileSync(dbFile));

function saveDB(){
fs.writeFileSync(dbFile, JSON.stringify(db,null,2));
}

function getUser(id){
if(!db[id]){
db[id]={
wallet:0,
bank:0,
gems:0,
lastDaily:0
};
}
return db[id];
}

client.on("messageCreate", async message=>{

if(message.author.bot) return;
if(!message.content.startsWith(prefix)) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);
const cmd = args.shift().toLowerCase();

const user = getUser(message.author.id);

//////////////// HELP //////////////////

if(cmd==="help"){

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

`);

message.reply({embeds:[embed]});

}

//////////////// BAL //////////////////

if(cmd==="bal"){

const embed = new EmbedBuilder()

.setColor("#f1c40f")

.setTitle("💰 BALANCE")

.setDescription(`

👤 **${message.author.username}**

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

`);

message.reply({embeds:[embed]});

}

//////////////// DAILY //////////////////

if(cmd==="daily"){

const now = Date.now();
const cd = 86400000;

if(now-user.lastDaily<cd){

const timeLeft = cd-(now-user.lastDaily);
const h = Math.floor(timeLeft/3600000);

const embed = new EmbedBuilder()

.setColor("Red")

.setDescription(`
You already claimed today's reward

⏱ Next Daily In **${h}h**
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

🎉 Daily Reward

💰 +${reward} coins added

`);

message.reply({embeds:[embed]});

}

//////////////// DEPOSIT //////////////////

if(cmd==="deposit"){

let amount = args[0];

if(amount==="all") amount=user.wallet;

amount=parseInt(amount);

if(!amount || user.wallet<amount) return message.reply("Not enough coins");

user.wallet-=amount;
user.bank+=amount;

saveDB();

message.reply(`🏦 Deposited **${amount}** coins`);
}

//////////////// WITHDRAW //////////////////

if(cmd==="withdraw"){

let amount = args[0];

if(amount==="all") amount=user.bank;

amount=parseInt(amount);

if(!amount || user.bank<amount) return message.reply("Not enough bank coins");

user.bank-=amount;
user.wallet+=amount;

saveDB();

message.reply(`💵 Withdrawn **${amount}** coins`);
}

//////////////// COINFLIP //////////////////

if(cmd==="cf"){

let amount=args[0];

if(amount==="all") amount=user.wallet;

amount=parseInt(amount);

if(!amount || user.wallet<amount) return message.reply("Not enough coins");

const msg = await message.reply("🪙 Flipping coin...");

const flip = ["HEADS","TAILS"][Math.floor(Math.random()*2)];

await new Promise(r=>setTimeout(r,2000));

const win = Math.random()<0.5;

if(win){

user.wallet+=amount;

await msg.edit(`🪙 **${flip}**

🎉 You won **${amount} coins**`);

}else{

user.wallet-=amount;

await msg.edit(`🪙 **${flip}**

💀 You lost **${amount} coins**`);

}

saveDB();

}

//////////////// SLOT //////////////////

if(cmd==="slot"){

let amount=args[0];

if(amount==="all") amount=user.wallet;

amount=parseInt(amount);

if(!amount || user.wallet<amount) return message.reply("Not enough coins");

const msg = await message.reply("🎰 Spinning...");

await new Promise(r=>setTimeout(r,2000));

const icons=["🍒","🍋","🍇","💎","7️⃣"];

const r1=icons[Math.floor(Math.random()*icons.length)];
const r2=icons[Math.floor(Math.random()*icons.length)];
const r3=icons[Math.floor(Math.random()*icons.length)];

let result=`${r1} | ${r2} | ${r3}`;

if(r1===r2 && r2===r3){

const win=amount*3;
user.wallet+=win;

await msg.edit(`🎰 ${result}

🔥 JACKPOT!

💰 Won **${win} coins**`);

}else{

user.wallet-=amount;

await msg.edit(`🎰 ${result}

💀 Lost **${amount} coins**`);

}

saveDB();

}

});

client.once("ready",()=>{
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
