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
lastDaily:0
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

//////////// HELP ////////////

if(cmd==="help"){

const embed=new EmbedBuilder()

.setColor("#f1c40f")

.setTitle("⚡ SPARK BOT COMMANDS")

.setDescription(`

💰 **ECONOMY**
s bal
s daily
s deposit <amount>
s withdraw <amount>
s give @user <amount>

🎰 **CASINO**
s cf <amount/all>
s slot <amount/all>

`);

message.reply({embeds:[embed]});
}

//////////// BAL ////////////

if(cmd==="bal"){

const embed=new EmbedBuilder()

.setColor("#f1c40f")

.setTitle("💰 BALANCE")

.setDescription(`

👤 ${message.author.username}

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}
💎 Gems   : ${user.gems}

`);

message.reply({embeds:[embed]});
}

//////////// DAILY ////////////

if(cmd==="daily"){

const now=Date.now();
const cd=86400000;

if(now-user.lastDaily<cd){

const t=cd-(now-user.lastDaily);
const h=Math.floor(t/3600000);

return message.reply(`⏱ Next daily in ${h}h`);
}

const reward=500;

user.wallet+=reward;
user.lastDaily=now;

saveDB();

message.reply(`🎉 Daily reward claimed +${reward}`);
}

//////////// DEPOSIT ////////////

if(cmd==="deposit"){

let amount=args[0];

if(amount==="all") amount=user.wallet;

amount=parseInt(amount);

if(!amount || user.wallet<amount) return message.reply("Not enough coins");

user.wallet-=amount;
user.bank+=amount;

saveDB();

message.reply(`🏦 Deposited ${amount}`);
}

//////////// WITHDRAW ////////////

if(cmd==="withdraw"){

let amount=args[0];

if(amount==="all") amount=user.bank;

amount=parseInt(amount);

if(!amount || user.bank<amount) return message.reply("Not enough bank coins");

user.bank-=amount;
user.wallet+=amount;

saveDB();

message.reply(`💵 Withdrawn ${amount}`);
}

//////////// GIVE ////////////

if(cmd==="give"){

const target=message.mentions.users.first();
const amount=parseInt(args[1]);

if(!target) return message.reply("Mention user");

if(!amount) return message.reply("Enter amount");

const targetUser=getUser(target.id);

if(user.wallet<amount) return message.reply("Not enough coins");

user.wallet-=amount;
targetUser.wallet+=amount;

saveDB();

message.reply(`💸 Sent ${amount} coins to ${target.username}`);
}

//////////// COINFLIP ANIMATION ////////////

if(cmd==="cf"){

let amount=args[0];

if(amount==="all") amount=user.wallet;

amount=parseInt(amount);

if(!amount || user.wallet<amount) return message.reply("Not enough coins");

const msg=await message.reply("🪙 Preparing coin...");

const frames=[
"🪙",
"🔘",
"🪙",
"🔘",
"🪙"
];

for(const f of frames){
await new Promise(r=>setTimeout(r,400));
await msg.edit(`🪙 Flipping...\n${f}`);
}

const result=Math.random()<0.5?"HEADS":"TAILS";

const win=Math.random()<0.5;

if(win){

user.wallet+=amount;

await msg.edit(`🪙 ${result}

🎉 You won ${amount}`);

}else{

user.wallet-=amount;

await msg.edit(`🪙 ${result}

💀 You lost ${amount}`);

}

saveDB();
}

//////////// SLOT ANIMATION ////////////

if(cmd==="slot"){

let amount=args[0];

if(amount==="all") amount=user.wallet;

amount=parseInt(amount);

if(!amount || user.wallet<amount) return message.reply("Not enough coins");

const msg=await message.reply("🎰 Starting slot...");

const icons=["🍒","🍋","🍇","💎","7️⃣"];

for(let i=0;i<4;i++){

const r1=icons[Math.floor(Math.random()*icons.length)];
const r2=icons[Math.floor(Math.random()*icons.length)];
const r3=icons[Math.floor(Math.random()*icons.length)];

await new Promise(r=>setTimeout(r,500));

await msg.edit(`🎰 ${r1} | ${r2} | ${r3}`);
}

const r1=icons[Math.floor(Math.random()*icons.length)];
const r2=icons[Math.floor(Math.random()*icons.length)];
const r3=icons[Math.floor(Math.random()*icons.length)];

if(r1===r2 && r2===r3){

const win=amount*3;

user.wallet+=win;

await msg.edit(`🎰 ${r1} | ${r2} | ${r3}

🔥 JACKPOT
Won ${win}`);

}else{

user.wallet-=amount;

await msg.edit(`🎰 ${r1} | ${r2} | ${r3}

💀 Lost ${amount}`);

}

saveDB();
}

});

client.once("ready",()=>{
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
