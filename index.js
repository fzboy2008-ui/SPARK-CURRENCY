const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const prefix = "s";
const botOwner = "fzboy786_01978";

let users = {};
let servers = {};

if(fs.existsSync("./database/users.json"))
users = JSON.parse(fs.readFileSync("./database/users.json"));

if(fs.existsSync("./database/servers.json"))
servers = JSON.parse(fs.readFileSync("./database/servers.json"));

function save(){
fs.writeFileSync("./database/users.json",JSON.stringify(users,null,2));
fs.writeFileSync("./database/servers.json",JSON.stringify(servers,null,2));
}

function getUser(id){
if(!users[id]){
users[id] = {
wallet:500,
bank:0,
gems:0,
xp:0,
level:0,
wins:0,
loses:0,
dragons:[],
weapons:[],
armours:[],
selectedDragon:null,
dragonLevel:1,
lastDaily:0
}
}
return users[id]
}

client.on("ready",()=>{
console.log(`Bot Ready ${client.user.tag}`)
})

client.on("messageCreate", async message=>{

if(message.author.bot) return

const user = getUser(message.author.id)

user.xp += 1

let need = (user.level+1)*2500

if(user.xp >= need){
user.level++
let reward = user.level*5000
user.wallet += reward
message.channel.send(`🏅 ${message.author} leveled up to ${user.level} (+${reward})`)
}

save()

if(!message.content.startsWith(prefix)) return

const args = message.content.slice(prefix.length).trim().split(/ +/)
const cmd = args.shift().toLowerCase()

////////////////////////////////////////////////////
//// BAL
////////////////////////////////////////////////////

if(cmd === "bal"){

const embed = new EmbedBuilder()
.setTitle(`${message.author.username} Balance`)
.addFields(
{name:"👛 Wallet",value:user.wallet.toString(),inline:true},
{name:"🏦 Bank",value:user.bank.toString(),inline:true},
{name:"💎 Gems",value:user.gems.toString(),inline:true}
)

message.reply({embeds:[embed]})
}

////////////////////////////////////////////////////
//// DAILY
////////////////////////////////////////////////////

if(cmd === "daily"){

let now = Date.now()

if(now-user.lastDaily < 86400000)
return message.reply("Daily already claimed")

user.wallet += 500
user.lastDaily = now

message.reply("🎁 +500 coins")

save()
}

////////////////////////////////////////////////////
//// GIVE
////////////////////////////////////////////////////

if(cmd === "give"){

let target = message.mentions.users.first()
let amount = parseInt(args[1])

if(!target) return
if(user.wallet < amount) return message.reply("Not enough coins")

let t = getUser(target.id)

user.wallet -= amount
t.wallet += amount

message.reply(`Transferred ${amount} coins`)

save()
}

////////////////////////////////////////////////////
//// COINFLIP
////////////////////////////////////////////////////

if(cmd === "cf"){

let bet = args[0]

if(bet === "all") bet = user.wallet

bet = parseInt(bet)

if(bet > 200000) bet = 200000

if(user.wallet < bet) return

const msg = await message.reply("🪙 Flipping coin...")

setTimeout(()=>{

let win = Math.random()<0.2

if(win){
user.wallet += bet
msg.edit(`🪙 Coinflip Result

🎉 LUCKY WIN
Won : ${bet}`)
}else{
user.wallet -= bet
msg.edit(`🪙 Coinflip Result

💀 BAD LUCK
Lost : ${bet}`)
}

save()

},3000)

}

////////////////////////////////////////////////////
//// SLOT
////////////////////////////////////////////////////

if(cmd === "slot"){

let bet = args[0]

if(bet === "all") bet = user.wallet

bet = parseInt(bet)

if(bet > 200000) bet = 200000

if(user.wallet < bet) return

const slots = ["💎","🥭","🍉"]

const spin = await message.reply("🎰 Spinning...")

setTimeout(()=>{

let s1 = slots[Math.floor(Math.random()*3)]
let s2 = slots[Math.floor(Math.random()*3)]
let s3 = slots[Math.floor(Math.random()*3)]

let reward = 0

if(s1==="💎" && s2==="💎" && s3==="💎") reward = bet*3
else if(s1==="🥭" && s2==="🥭" && s3==="🥭") reward = bet*2
else if(s1==="🍉" && s2==="🍉" && s3==="🍉") reward = bet
else reward = -bet

user.wallet += reward

spin.edit(`
___SLOTS___

${s1} ${s2} ${s3}

💸 | ${message.author.username} • bet ${bet}

${reward>=0 ? `🎉 Won ${reward}`:`💀 Lost ${bet}`}
`)

save()

},3000)

}

////////////////////////////////////////////////////
//// INVENTORY
////////////////////////////////////////////////////

if(cmd === "inv"){

message.reply(`
📦 INVENTORY

🐉 Dragons : ${user.dragons.join(", ") || "None"}

⚔ Weapons : ${user.weapons.join(", ") || "None"}

🛡 Armours : ${user.armours.join(", ") || "None"}
`)
}

////////////////////////////////////////////////////
//// SHOP
////////////////////////////////////////////////////

if(cmd === "shop"){

message.reply(`
🏪 SHOP

s shop dragons
s shop weapons
s shop armours
`)
}

////////////////////////////////////////////////////
//// DRAGON SHOP
////////////////////////////////////////////////////

if(cmd === "dragons"){

message.reply(`
🐉 DRAGONS

🔥 Fire Dragon - 4,000,000
⚡ Lightning Dragon - 6,000,000
🌪 Wind Dragon - 7,000,000
❄ Ice Dragon - 9,000,000
`)
}

////////////////////////////////////////////////////
//// SET DRAGON
////////////////////////////////////////////////////

if(cmd === "set"){

let name = args[0]

if(!user.dragons.includes(name))
return message.reply("You don't own this dragon")

user.selectedDragon = name

message.reply(`${name} dragon selected`)

save()
}

////////////////////////////////////////////////////
//// FEED DRAGON
////////////////////////////////////////////////////

if(cmd === "feed"){

if(user.gems < 100) return

user.gems -= 100
user.dragonLevel++

message.reply(`🐉 Dragon leveled up to ${user.dragonLevel}`)

save()
}

////////////////////////////////////////////////////
//// LEADERBOARD COINS
////////////////////////////////////////////////////

if(cmd === "lb" && args[0]==="c"){

let sorted = Object.entries(users)
.sort((a,b)=>b[1].wallet-a[1].wallet)
.slice(0,10)

let text="🏆 COINS LEADERBOARD\n\n"

sorted.forEach((u,i)=>{
text += `${i+1}. <@${u[0]}> — ${u[1].wallet}\n`
})

message.reply(text)

}

////////////////////////////////////////////////////
//// LEADERBOARD BATTLES
////////////////////////////////////////////////////

if(cmd === "lb" && args[0]==="b"){

let sorted = Object.entries(users)
.sort((a,b)=>b[1].wins-a[1].wins)
.slice(0,10)

let text="⚔ BATTLE LEADERBOARD\n\n"

sorted.forEach((u,i)=>{
text += `${i+1}. <@${u[0]}> — Wins:${u[1].wins} Lose:${u[1].loses}\n`
})

message.reply(text)

}

////////////////////////////////////////////////////
//// CHALLENGE
////////////////////////////////////////////////////

if(cmd==="challenge"){

let target = message.mentions.users.first()

if(!target) return

const msg = await message.reply(`⚔ Battle starting...`)

setTimeout(()=>{

let t = getUser(target.id)

let p1 = user.dragonLevel + Math.random()*10
let p2 = t.dragonLevel + Math.random()*10

let winner

if(p1>p2){
user.wins++
t.loses++
user.gems += 10
winner = message.author.username
}else{
t.wins++
user.loses++
t.gems += 10
winner = target.username
}

msg.edit(`
⚔ DRAGON BATTLE

${message.author.username} vs ${target.username}

Winner : ${winner}
Reward : 💎 10 Gems
`)

save()

},6000)

}

})

client.login(process.env.TOKEN)
