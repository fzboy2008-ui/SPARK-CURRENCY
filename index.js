const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");

const client = new Client({
 intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
});

const prefix = "s";
const owner = "fzboy786_01978";
const maxGamble = 500000;

const DB = "./database.json";
let db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : {};

function save() {
 fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}

function getUser(id) {
 if (!db[id]) {
  db[id] = {
   wallet: 0,
   bank: 0,
   xp: 0,
   rank: 0,
   gems: 0,
   dragons: [],
   selectedDragon: null,
   battles: 0,
   lastDaily: 0,
   inv:{weapon:[],armour:[]}
  };
 }
 return db[id];
}

function levelReq(rank){
 return 2500*(rank+1);
}

function progressBar(p){
 let bars=Math.floor(p*10);
 return "🟩".repeat(bars)+"⬛".repeat(10-bars);
}

client.on("ready",()=>{
 console.log("SPARK BOT ONLINE");
});

client.on("messageCreate",async msg=>{

 if(msg.author.bot) return;

 const user=getUser(msg.author.id);

 user.xp++;

 let req=levelReq(user.rank);

 if(user.xp>=req){
  user.rank++;
  user.wallet+=5000*(user.rank);
  msg.channel.send(`🎉 ${msg.author} ranked up to **${user.rank}**`);
 }

 save();

 if(!msg.content.startsWith(prefix)) return;

 const args=msg.content.slice(prefix.length).trim().split(/ +/);
 const cmd=args.shift().toLowerCase();





// HELP
if(cmd==="help"){
 return msg.reply({
 embeds:[new EmbedBuilder()
 .setColor("Purple")
 .setTitle("SPARK COMMANDS")
 .setDescription(`
💰 s cash
🎁 s daily
📊 s lvl
👤 s profile

🎲 s cf
🎰 s slot

🏦 s deposit
🏧 s withdraw
💸 s give

🐉 s dragon
🍖 s feed

🛒 s shop
🎒 s inv

⚔ s challenge
⚔ s accept

🏆 s lb
`)
 ]
 })
}






// DAILY
if(cmd==="daily"){

 let cd=86400000;

 if(Date.now()-user.lastDaily<cd){

  let left=cd-(Date.now()-user.lastDaily);

  let h=Math.floor(left/3600000);
  let m=Math.floor(left/60000)%60;

  return msg.reply(`⏳ Next reward in **${h}h ${m}m**`);
 }

 user.wallet+=500;
 user.lastDaily=Date.now();

 save();

 return msg.reply("🎁 You received **500 coins**");
}






// CASH
if(cmd==="cash"){
 return msg.reply({
 embeds:[new EmbedBuilder()
 .setColor("Gold")
 .setTitle(`💰 ${msg.author.username}`)
 .addFields(
 {name:"Wallet",value:`${user.wallet}`,inline:true},
 {name:"Bank",value:`${user.bank}`,inline:true}
 )
 ]
 })
}






// LVL
if(cmd==="lvl"){

 let req=levelReq(user.rank);
 let p=(user.xp%req)/req;

 return msg.reply({
 embeds:[new EmbedBuilder()
 .setColor("Blue")
 .setTitle(`${msg.author.username} Rank`)
 .addFields(
 {name:"Rank",value:`${user.rank}`,inline:true},
 {name:"XP",value:`${user.xp}`,inline:true},
 {name:"Progress",value:`${Math.floor(p*100)}%`},
 {name:"Bar",value:progressBar(p)}
 )
 ]
 })
}






// PROFILE
if(cmd==="profile"){

 let req=levelReq(user.rank);
 let p=(user.xp%req)/req;

 return msg.reply({
 embeds:[new EmbedBuilder()
 .setColor("Aqua")
 .setThumbnail(msg.author.displayAvatarURL())
 .setTitle(`${msg.author.username} Profile`)
 .addFields(
 {name:"Rank",value:`${user.rank}`,inline:true},
 {name:"Gems",value:`${user.gems}`,inline:true},
 {name:"Dragon",value:`${user.selectedDragon||"None"}`,inline:true},
 {name:"Progress",value:`${Math.floor(p*100)}%`}
 )
 ]
 })
}






// COINFLIP
if(cmd==="cf"){

 let amount=args[0]==="all"
 ?Math.min(user.wallet,maxGamble)
 :parseInt(args[0]);

 if(!amount||amount<=0) return;

 if(amount>user.wallet) return msg.reply("Not enough coins");

 amount=Math.min(amount,maxGamble);

 const flip=await msg.reply("🪙 flipping...");

 setTimeout(()=>{

 if(Math.random()<0.2){

 user.wallet+=amount;

 flip.edit(`🎉 WIN +${amount}`);

 }else{

 user.wallet-=amount;

 flip.edit(`💀 LOSE -${amount}`);

 }

 save();

 },1500);

}






// SLOT
if(cmd==="slot"){

 let amount=args[0]==="all"
 ?Math.min(user.wallet,maxGamble)
 :parseInt(args[0]);

 if(!amount||amount<=0) return;

 if(amount>user.wallet) return msg.reply("Not enough coins");

 amount=Math.min(amount,maxGamble);

 const slots=["🍒","🍉","💎","🍋","🍇"];

 const spin=()=>slots[Math.floor(Math.random()*slots.length)];

 let m=await msg.reply("🎰 | 🎰 | 🎰");

 setTimeout(()=>{

 let a=spin(),b=spin(),c=spin();

 let win=Math.random()<0.5;

 if(win){

 user.wallet+=amount;

 m.edit(`🎰 ${a} | ${b} | ${c}\n🎉 WIN +${amount}`);

 }else{

 user.wallet-=amount;

 m.edit(`🎰 ${a} | ${b} | ${c}\n💀 LOSE -${amount}`);

 }

 save();

 },2000)

}






// DEPOSIT
if(cmd==="deposit"){

 let amount=parseInt(args[0]);

 if(!amount||amount<=0) return;

 if(amount>user.wallet) return;

 user.wallet-=amount;
 user.bank+=amount;

 save();

 msg.reply(`🏦 Deposited ${amount}`);
}






// WITHDRAW
if(cmd==="withdraw"){

 let amount=parseInt(args[0]);

 if(!amount||amount<=0) return;

 if(amount>user.bank) return;

 user.bank-=amount;
 user.wallet+=amount;

 save();

 msg.reply(`🏧 Withdrawn ${amount}`);
}






// GIVE
if(cmd==="give"){

 let target=msg.mentions.users.first();
 let amount=parseInt(args[1]);

 if(!target||!amount) return;

 if(amount>user.wallet) return;

 let t=getUser(target.id);

 user.wallet-=amount;
 t.wallet+=amount;

 save();

 msg.reply(`💸 Sent ${amount} to ${target.username}`);
}






// SHOP
if(cmd==="shop"){

 return msg.reply({
 embeds:[new EmbedBuilder()
 .setColor("Orange")
 .setTitle("SPARK SHOP")
 .setDescription(`
🐉 Dragons: 4m-6m
🛡 Armour: 500k
🗡 Weapon: 1m
`)
 ]
 })
}






// INVENTORY
if(cmd==="inv"){

 return msg.reply({
 embeds:[new EmbedBuilder()
 .setColor("Grey")
 .setTitle(`${msg.author.username} Inventory`)
 .addFields(
 {name:"Dragons",value:user.dragons.join(", ")||"None"},
 {name:"Weapons",value:user.inv.weapon.join(", ")||"None"},
 {name:"Armours",value:user.inv.armour.join(", ")||"None"}
 )
 ]
 })
}






// LEADERBOARD
if(cmd==="lb"){

 let top=Object.entries(db)
 .sort((a,b)=>(b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank))
 .slice(0,10);

 let text="";

 top.forEach((u,i)=>{
 text+=`${i+1}. <@${u[0]}> — ${u[1].wallet+u[1].bank}\n`
 });

 msg.reply({
 embeds:[new EmbedBuilder()
 .setColor("Gold")
 .setTitle("Leaderboard")
 .setDescription(text)
 ]
 })

}





});

client.login(process.env.TOKEN);
