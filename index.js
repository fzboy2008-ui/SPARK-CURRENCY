// DEMO: Large Discord Economy Bot Scaffold (simulating 1000+ line project) // This file shows a condensed but feature‑rich structure used in big bots. // In real projects this would be split into many files.

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js"); const fs = require("fs"); require("dotenv").config();

const client = new Client({ intents:[ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ] });

// ================= CONFIG ================= const PREFIX="s"; const DAILY_COOLDOWN=86400000; const WORK_COOLDOWN=3600000;

// ================= DATABASE ================= if(!fs.existsSync("./database")) fs.mkdirSync("./database"); if(!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json","{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function save(){ fs.writeFileSync("./database/users.json",JSON.stringify(users,null,2)); }

function getUser(id){ if(!users[id]){ users[id]={ wallet:0, bank:0, gems:0, xp:0, level:0, inventory:[], lastDaily:0, lastWork:0, lastCrime:0, lastRob:0 }; } return users[id]; }

// ================= LEVEL SYSTEM ================= function xpNeeded(level){ return (level+1)*2500; }

function xpBar(xp,level){ const need=xpNeeded(level); const percent=Math.floor((xp/need)*100); const bars=Math.floor(percent/10); return "█".repeat(bars)+"░".repeat(10-bars)+ ${percent}%; }

function addXP(user,amount){ user.xp+=amount; const need=xpNeeded(user.level);

if(user.xp>=need){ user.level++; user.wallet+=user.level*1000; } }

// ================= SHOP ================= const shop={ laptop:{price:15000,name:"💻 Laptop"}, phone:{price:8000,name:"📱 Phone"}, car:{price:50000,name:"🚗 Car"}, mansion:{price:200000,name:"🏠 Mansion"}, yacht:{price:500000,name:"🛥 Yacht"}, island:{price:1000000,name:"🏝 Private Island"} };

// ================= CASINO ================= function coinflip(user,bet){ const win=Math.random()<0.45;

if(win){ const reward=bet*2; user.wallet+=reward; return {result:"win",amount:reward}; }

return {result:"lose",amount:bet}; }

function slotMachine(bet){ const symbols=["💎","🍒","🍉","🥭"];

const a=symbols[Math.floor(Math.random()*symbols.length)]; const b=symbols[Math.floor(Math.random()*symbols.length)]; const c=symbols[Math.floor(Math.random()*symbols.length)];

if(a===b && b===c){ return {win:true,reward:bet*3,grid:${a}|${b}|${c}}; }

return {win:false,reward:0,grid:${a}|${b}|${c}}; }

// ================= JOB SYSTEM ================= function workReward(){ return 1000+Math.floor(Math.random()*3000); }

function crimeAttempt(){ const success=Math.random()<0.5;

if(success){ return {success:true,reward:3000+Math.floor(Math.random()*4000)}; }

return {success:false,loss:1500}; }

// ================= EVENTS ================= client.once("ready",()=>{ console.log("Demo Economy Bot Ready: "+client.user.tag); });

client.on("messageCreate",async message=>{

if(message.author.bot) return; if(!message.content.startsWith(PREFIX)) return;

const args=message.content.slice(PREFIX.length).trim().split(/ +/); const cmd=args.shift().toLowerCase();

const user=getUser(message.author.id);

addXP(user,5);

// ================= BAL ================= if(cmd==="bal"||cmd==="balance"){

return message.reply( Wallet: ${user.wallet} Bank: ${user.bank} Level: ${user.level} XP: ${xpBar(user.xp,user.level)}); }

// ================= DAILY ================= if(cmd==="daily"){

const now=Date.now();

if(now-user.lastDaily<DAILY_COOLDOWN) return message.reply("Come back tomorrow");

const reward=4000+Math.floor(Math.random()*4000);

user.wallet+=reward; user.lastDaily=now;

save();

return message.reply(Daily reward +${reward}); }

// ================= DEPOSIT ================= if(cmd==="deposit"){

let amount=args[0];

if(amount==="all") amount=user.wallet;

amount=parseInt(amount);

if(user.wallet<amount) return message.reply("Not enough coins");

user.wallet-=amount; user.bank+=amount;

save();

return message.reply(Deposited ${amount}); }

// ================= WITHDRAW ================= if(cmd==="withdraw"){

let amount=args[0];

if(amount==="all") amount=user.bank;

amount=parseInt(amount);

if(user.bank<amount) return message.reply("Not enough coins");

user.bank-=amount; user.wallet+=amount;

save();

return message.reply(Withdraw ${amount}); }

// ================= COINFLIP ================= if(cmd==="cf"){

const bet=parseInt(args[0]);

if(user.wallet<bet) return message.reply("Not enough coins");

user.wallet-=bet;

const game=coinflip(user,bet);

save();

if(game.result==="win") return message.reply(Coinflip WIN +${game.amount});

return message.reply(Coinflip LOST -${bet}); }

// ================= SLOT ================= if(cmd==="slot"){

const bet=parseInt(args[0]);

if(user.wallet<bet) return message.reply("Not enough coins");

user.wallet-=bet;

const game=slotMachine(bet);

if(game.win){ user.wallet+=game.reward; save(); return message.reply(${game.grid} WIN +${game.reward}); }

save(); return message.reply(${game.grid} LOSE); }

// ================= WORK ================= if(cmd==="work"){

const now=Date.now();

if(now-user.lastWork<WORK_COOLDOWN) return message.reply("Work cooldown active");

const reward=workReward();

user.wallet+=reward; user.lastWork=now;

save();

return message.reply(You worked and earned ${reward}); }

// ================= SHOP ================= if(cmd==="shop"){

let text="SHOP\n";

for(const item in shop){ text+=${shop[item].name} - ${shop[item].price}\n; }

return message.reply(text); }

// ================= BUY ================= if(cmd==="buy"){

const item=args[0];

if(!shop[item]) return message.reply("Item not found");

const price=shop[item].price;

if(user.wallet<price) return message.reply("Not enough coins");

user.wallet-=price; user.inventory.push(item);

save();

return message.reply(Purchased ${shop[item].name}); }

// ================= INVENTORY ================= if(cmd==="inventory"){

if(user.inventory.length===0) return message.reply("Inventory empty");

let text="Inventory\n";

user.inventory.forEach(i=>{ text+=shop[i].name+"\n"; });

return message.reply(text); }

// ================= PROFILE ================= if(cmd==="profile"){

const embed=new EmbedBuilder() .setTitle(${message.author.username} Profile) .setDescription(Wallet: ${user.wallet} Bank: ${user.bank} Level: ${user.level} XP: ${xpBar(user.xp,user.level)});

return message.reply({embeds:[embed]}); }

// ================= LEADERBOARD ================= if(cmd==="leaderboard"){

const top=Object.entries(users) .sort((a,b)=>(b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank)) .slice(0,10);

let text="Leaderboard\n";

top.forEach((u,i)=>{ text+=${i+1}. <@${u[0]}> - ${u[1].wallet+u[1].bank}\n; });

return message.reply(text); }

save();

});

client.login(process.env.TOKEN);

// NOTE: // In a real 1000+ line bot this logic would be split into many files: // commands/, events/, economy/, casino/, jobs/, utils/, database/ etc.
