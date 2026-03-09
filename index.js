const { 
 Client,
 GatewayIntentBits,
 EmbedBuilder
} = require("discord.js");

const fs = require("fs");

const client = new Client({
 intents:[
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
});

const prefix = "s ";

let users = {};

if(fs.existsSync("users.json")){
 users = JSON.parse(fs.readFileSync("users.json"));
}

function save(){
 fs.writeFileSync("users.json",JSON.stringify(users,null,2));
}

function getUser(id){

 if(!users[id]){

  users[id] = {

   wallet:0,
   bank:0,
   gems:0,

   xp:0,
   level:1,

   battleWins:0,
   battleLoss:0,

   inventory:[],

   lastDaily:0,
   lastWork:0

  };

 }

 return users[id];

}

function addXP(id,amount){

 let user = getUser(id);

 user.xp += amount;

 let need = user.level * 100;

 if(user.xp >= need){

  user.xp = 0;
  user.level += 1;

 }

 save();

}

function addGems(id,amount){

 let user = getUser(id);

 user.gems += amount;

 save();

}

function addItem(id,item){

 let user = getUser(id);

 user.inventory.push(item);

 save();

}

function removeItem(id,item){

 let user = getUser(id);

 let i = user.inventory.indexOf(item);

 if(i > -1){

  user.inventory.splice(i,1);

 }

 save();

}

client.on("ready",()=>{

 console.log("V6 RPG BOT ONLINE");

});

client.on("messageCreate",async message=>{

 if(message.author.bot) return;

 if(!message.content.startsWith(prefix)) return;

 const args = message.content.slice(prefix.length).trim().split(/ +/);
 const cmd = args.shift().toLowerCase();

 const user = getUser(message.author.id);

 // ================= BALANCE =================

 if(cmd === "balance" || cmd === "bal"){

  const embed = new EmbedBuilder()
  .setTitle(`${message.author.username} Balance`)
  .setColor("Gold")
  .setDescription(`
🪙 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
`);

  return message.reply({embeds:[embed]});

 }

 // ================= DAILY =================

 if(cmd === "daily"){

  let now = Date.now();

  if(now - user.lastDaily < 86400000){

   return message.reply("You already claimed daily");

  }

  let reward = Math.floor(Math.random()*300)+200;

  user.wallet += reward;
  user.lastDaily = now;

  save();

  const embed = new EmbedBuilder()
  .setTitle("Daily Reward")
  .setColor("Green")
  .setDescription(`You received 🪙 ${reward}`);

  return message.reply({embeds:[embed]});

 }

 // ================= WORK =================

 if(cmd === "work"){

  let reward = Math.floor(Math.random()*150)+50;

  user.wallet += reward;

  addXP(message.author.id,20);

  save();

  const embed = new EmbedBuilder()
  .setTitle("Work Complete")
  .setColor("Orange")
  .setDescription(`You earned 🪙 ${reward}`);

  return message.reply({embeds:[embed]});

 }

 // ================= STATS =================

 if(cmd === "stats"){

  const embed = new EmbedBuilder()
  .setTitle(`${message.author.username} Stats`)
  .setColor("Blue")
  .setDescription(`
Level: ${user.level}
XP: ${user.xp}

⚔ Wins: ${user.battleWins}
💀 Loss: ${user.battleLoss}

💎 Gems: ${user.gems}
`);

  return message.reply({embeds:[embed]});

 }

 // ================= INVENTORY =================

 if(cmd === "inventory" || cmd === "inv"){

  let items = user.inventory.length
  ? user.inventory.join("\n")
  : "Empty";

  const embed = new EmbedBuilder()
  .setTitle("Inventory")
  .setColor("Purple")
  .setDescription(items);

  return message.reply({embeds:[embed]});

 }

 // ================= LOOT =================

 if(cmd === "loot"){

  const loot = ["sword","armor","gem","potion"];

  const item = loot[Math.floor(Math.random()*loot.length)];

  addItem(message.author.id,item);

  if(item === "gem") addGems(message.author.id,5);

  const embed = new EmbedBuilder()
  .setTitle("Loot Found")
  .setColor("Aqua")
  .setDescription(`You found **${item}**`);

  return message.reply({embeds:[embed]});

 }

 // ================= BATTLE =================

 if(cmd === "battle"){

  let win = Math.random() > 0.5;

  if(win){

   user.battleWins += 1;

   let reward = Math.floor(Math.random()*200)+100;

   user.wallet += reward;

   addXP(message.author.id,40);

   save();

   return message.reply(`⚔ You won the battle and earned 🪙 ${reward}`);

  }else{

   user.battleLoss += 1;

   save();

   return message.reply("💀 You lost the battle");

  }

 }

});
// ================= SHOP =================

const shop = {
 sword:{price:500},
 armor:{price:400},
 potion:{price:200}
};

client.on("messageCreate", async message => {

 if(message.author.bot) return;
 if(!message.content.startsWith(prefix)) return;

 const args = message.content.slice(prefix.length).trim().split(/ +/);
 const cmd = args.shift().toLowerCase();

 const user = getUser(message.author.id);

 // SHOP

 if(cmd === "shop"){

  let text = "";

  for(let item in shop){

   text += `${item} — 🪙 ${shop[item].price}\n`;

  }

  const embed = new EmbedBuilder()
  .setTitle("RPG Shop")
  .setColor("Gold")
  .setDescription(text);

  return message.reply({embeds:[embed]});

 }

 // BUY

 if(cmd === "buy"){

  let item = args[0];

  if(!shop[item]) return message.reply("Item not found");

  let price = shop[item].price;

  if(user.wallet < price)
  return message.reply("Not enough coins");

  user.wallet -= price;

  addItem(message.author.id,item);

  save();

  return message.reply(`You bought **${item}**`);

 }

 // ================= QUEST =================

 if(cmd === "quest"){

  let reward = Math.floor(Math.random()*300)+100;

  user.wallet += reward;

  addXP(message.author.id,50);

  save();

  const embed = new EmbedBuilder()
  .setTitle("Quest Complete")
  .setColor("Green")
  .setDescription(`Reward: 🪙 ${reward}`);

  return message.reply({embeds:[embed]});

 }

 // ================= CRAFT =================

 if(cmd === "craft"){

  if(user.inventory.includes("sword") && user.inventory.includes("armor")){

   removeItem(message.author.id,"sword");
   removeItem(message.author.id,"armor");

   addItem(message.author.id,"mega_sword");

   return message.reply("You crafted **Mega Sword**");

  }

  return message.reply("Need sword + armor");

 }

 // ================= BALANCE LEADERBOARD =================

 if(cmd === "lb" || cmd === "leaderboard"){

  if(args[0] === "battles"){

   let arr = Object.entries(users);

   arr.sort((a,b)=>b[1].battleWins - a[1].battleWins);

   arr = arr.slice(0,10);

   let medals=["🥇","🥈","🥉"];

   let text="";

   arr.forEach((u,i)=>{

    let medal = medals[i] || `#${i+1}`;

    text += `${medal} <@${u[0]}>
Battle Wins: ${u[1].battleWins}

`;

   });

   const embed = new EmbedBuilder()
   .setTitle("⚔ Battle Leaderboard")
   .setColor("Red")
   .setDescription(text);

   return message.reply({embeds:[embed]});

  }

  let arr = Object.entries(users);

  arr.sort((a,b)=>{
   return (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank);
  });

  arr = arr.slice(0,10);

  let medals=["🥇","🥈","🥉"];

  let text="";

  arr.forEach((u,i)=>{

   let medal = medals[i] || `#${i+1}`;

   text += `${medal} <@${u[0]}>
🪙: ${u[1].wallet}
💎: ${u[1].gems}

`;

  });

  const embed = new EmbedBuilder()
  .setTitle("💰 Richest Players")
  .setColor("Gold")
  .setDescription(text);

  return message.reply({embeds:[embed]});

 }

});

// ================= ITEM INFO =================

const rarity = {
 sword:"Common",
 armor:"Common",
 potion:"Common",
 mega_sword:"Legendary"
};

client.on("messageCreate", async message => {

 if(message.author.bot) return;
 if(!message.content.startsWith(prefix)) return;

 const args = message.content.slice(prefix.length).trim().split(/ +/);
 const cmd = args.shift().toLowerCase();

 if(cmd === "item"){

  let name = args[0];

  if(!rarity[name]) return message.reply("Item not found");

  const embed = new EmbedBuilder()
  .setTitle(name)
  .setColor("Purple")
  .setDescription(`Rarity: ${rarity[name]}`);

  return message.reply({embeds:[embed]});

 }

});

// ================= LOGIN =================

client.login(process.env.TOKEN);
