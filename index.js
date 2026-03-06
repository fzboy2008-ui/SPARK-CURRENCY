const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js')
const fs = require('fs')

const client = new Client({
 intents:[
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
})

const prefix = "s "

/* DATABASE */

if(!fs.existsSync("./database")) fs.mkdirSync("./database")

if(!fs.existsSync("./database/users.json")){
 fs.writeFileSync("./database/users.json","{}")
}

let users = JSON.parse(fs.readFileSync("./database/users.json"))

function save(){
 fs.writeFileSync("./database/users.json",JSON.stringify(users,null,2))
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
    armours:[],
    items:[]
   },

   dragonStats:{
    level:1,
    xp:0,
    hp:100,
    attack:20
   },

   lastDaily:0,

   wins:0,
   loses:0
  }

 }

 return users[id]

}

/* READY */

client.once("ready",()=>{

 console.log("⚡ SPARK BOT ONLINE")

})

/* XP SYSTEM */

client.on("messageCreate",async msg=>{

 if(msg.author.bot) return

 let user = getUser(msg.author.id)

 user.xp += 5

 let needed = user.level * 2500

 if(user.xp >= needed){

  user.xp = 0
  user.level += 1

  let reward = user.level * 2000

  user.wallet += reward

  const embed = new EmbedBuilder()
  .setColor("Gold")
  .setTitle("🏆 LEVEL UP")
  .setDescription(`
👤 ${msg.author}

New Level: **${user.level}**

Reward: **${reward} coins**
`)

  msg.channel.send({embeds:[embed]})

 }

 save()

})

/* COMMAND HANDLER */

client.on("messageCreate",async msg=>{

 if(msg.author.bot) return
 if(!msg.content.startsWith(prefix)) return

 const args = msg.content.slice(prefix.length).trim().split(/ +/)
 const cmd = args.shift().toLowerCase()

 let user = getUser(msg.author.id)

/* HELP */

if(cmd==="help"){

const embed = new EmbedBuilder()
.setColor("Aqua")
.setTitle("⚡ SPARK BOT COMMANDS")
.setDescription(`
💰 ECONOMY
s bal
s deposit
s withdraw
s give

🎁 REWARDS
s daily

👤 PROFILE
s profile
s lvl
s inv

🎰 GAMES
s cf
s slot

🐉 DRAGON
s dragon
s train
s feed

⚔ BATTLE
s challenge

🏆 LEADERBOARD
s top

🛒 SHOP
s shop
`)

msg.reply({embeds:[embed]})

}

/* BALANCE */

if(cmd==="bal"){

const embed = new EmbedBuilder()
.setColor("Green")
.setTitle(`💰 ${msg.author.username} Balance`)
.setDescription(`
👛 Wallet: **${user.wallet}**

🏦 Bank: **${user.bank}**

💎 Gems: **${user.gems}**
`)

msg.reply({embeds:[embed]})

}

/* DEPOSIT */

if(cmd==="deposit"){

let amount = args[0]

if(amount==="all") amount = user.wallet

amount = parseInt(amount)

if(!amount || amount<=0) return msg.reply("❌ Invalid amount")

if(amount>user.wallet) return msg.reply("❌ Not enough wallet coins")

user.wallet -= amount
user.bank += amount

save()

msg.reply(`🏦 Deposited **${amount}** coins`)

}

/* WITHDRAW */

if(cmd==="withdraw"){

let amount = args[0]

if(amount==="all") amount = user.bank

amount = parseInt(amount)

if(!amount || amount<=0) return msg.reply("❌ Invalid amount")

if(amount>user.bank) return msg.reply("❌ Not enough bank coins")

user.bank -= amount
user.wallet += amount

save()

msg.reply(`👛 Withdrawn **${amount}** coins`)

}

/* GIVE */

if(cmd==="give"){

let target = msg.mentions.users.first()
let amount = parseInt(args[1])

if(!target) return msg.reply("❌ Mention a user")

if(!amount || amount<=0) return msg.reply("❌ Enter amount")

if(amount>user.wallet) return msg.reply("❌ Not enough coins")

let targetUser = getUser(target.id)

user.wallet -= amount
targetUser.wallet += amount

save()

msg.reply(`💸 Sent **${amount}** coins to **${target.username}**`)

}

/* DAILY */

if(cmd==="daily"){

let now = Date.now()

if(now - user.lastDaily < 86400000){

 return msg.reply("⏳ You already claimed daily reward")

}

user.wallet += 1000
user.gems += 5

user.lastDaily = now

save()

const embed = new EmbedBuilder()
.setColor("Purple")
.setTitle("🎁 DAILY REWARD")
.setDescription(`
💰 Coins: **1000**

💎 Gems: **5**
`)

msg.reply({embeds:[embed]})

}

/* LEVEL */

if(cmd==="lvl"){

let needed = user.level * 2500

const embed = new EmbedBuilder()
.setColor("Blue")
.setTitle("🏅 LEVEL")
.setDescription(`
Level: **${user.level}**

XP: **${user.xp}/${needed}**
`)

msg.reply({embeds:[embed]})

}

/* PROFILE */

if(cmd==="profile" || cmd==="p"){

const embed = new EmbedBuilder()
.setColor("Orange")
.setTitle(`👤 ${msg.author.username} Profile`)
.setDescription(`
🏅 Level: **${user.level}**

🐉 Dragon: **${user.dragon ? user.dragon : "None"}**

⚔ Wins: **${user.wins}**

💀 Loses: **${user.loses}**
`)

msg.reply({embeds:[embed]})

}

/* INVENTORY */

if(cmd==="inv"){

const embed = new EmbedBuilder()
.setColor("Grey")
.setTitle("🎒 INVENTORY")
.setDescription(`
🐉 Dragons:
${user.inventory.dragons.join(", ") || "None"}

⚔ Weapons:
${user.inventory.weapons.join(", ") || "None"}

🛡 Armours:
${user.inventory.armours.join(", ") || "None"}

📦 Items:
${user.inventory.items.join(", ") || "None"}
`)

msg.reply({embeds:[embed]})

}
/* ================= COINFLIP ================= */

if(cmd==="cf" || cmd==="coinflip"){

let bet = args[0]

if(bet==="all") bet = user.wallet

bet = parseInt(bet)

if(!bet || bet<=0) return msg.reply("❌ Enter bet amount")

if(bet>user.wallet) return msg.reply("❌ Not enough coins")

if(bet>200000) bet = 200000

msg.channel.send("🪙 **Flipping Coin...**")

setTimeout(()=>{

let win = Math.random() < 0.5

if(win){

user.wallet += bet

const embed = new EmbedBuilder()
.setColor("Green")
.setTitle("🪙 COINFLIP RESULT")
.setDescription(`
✨ **YOU WON**

Bet: **${bet}**

Reward: **${bet}**
`)

msg.channel.send({embeds:[embed]})

}else{

user.wallet -= bet

const embed = new EmbedBuilder()
.setColor("Red")
.setTitle("🪙 COINFLIP RESULT")
.setDescription(`
💀 **YOU LOST**

Lost: **${bet}**
`)

msg.channel.send({embeds:[embed]})

}

save()

},3000)

}


/* ================= SLOT MACHINE ================= */

if(cmd==="slot"){

let bet = args[0]

if(bet==="all") bet = user.wallet

bet = parseInt(bet)

if(!bet || bet<=0) return msg.reply("❌ Enter bet")

if(bet>user.wallet) return msg.reply("❌ Not enough coins")

if(bet>200000) bet=200000

const symbols = ["💎","🥭","🍉"]

msg.channel.send(`
🎰 **SLOT MACHINE**

| ❔ | ❔ | ❔ |

Spinning...
`)

setTimeout(()=>{

let s1 = symbols[Math.floor(Math.random()*3)]
let s2 = symbols[Math.floor(Math.random()*3)]
let s3 = symbols[Math.floor(Math.random()*3)]

let result=""
let reward=0

/* JACKPOT */

if(s1==="💎" && s2==="💎" && s3==="💎"){

reward = bet*3
user.wallet += reward

result=`
🎰 **SLOTS RESULT**

| ${s1} | ${s2} | ${s3} |

💎 **JACKPOT**

Won: **${reward}**
`

}

/* 2x WIN */

else if(s1==="🥭" && s2==="🥭" && s3==="🥭"){

reward = bet*2
user.wallet += reward

result=`
🎰 **SLOTS RESULT**

| ${s1} | ${s2} | ${s3} |

🥭 **WIN**

Won: **${reward}**
`

}

/* TIE */

else if(s1==="🍉" && s2==="🍉" && s3==="🍉"){

result=`
🎰 **SLOTS RESULT**

| ${s1} | ${s2} | ${s3} |

🍉 **TIE**

Bet Returned
`

}

/* LOSE */

else{

user.wallet -= bet

result=`
🎰 **SLOTS RESULT**

| ${s1} | ${s2} | ${s3} |

💀 **LOSE**

Lost: **${bet}**
`

}

msg.channel.send(result)

save()

},4000)

}


/* ================= GLOBAL LEADERBOARD ================= */

if(cmd==="top" || cmd==="lb"){

let sorted = Object.entries(users)
.sort((a,b)=> (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank))
.slice(0,10)

let text="🏆 **GLOBAL LEADERBOARD**\n\n"

for(let i=0;i<sorted.length;i++){

let id = sorted[i][0]
let data = sorted[i][1]

text += `${i+1}. <@${id}> — 💰 ${data.wallet + data.bank}\n`

}

msg.channel.send(text)

   }
/* ================= MAIN SHOP ================= */

if(cmd==="shop"){

msg.channel.send(`
🛒 **SPARK SHOP**

🐉 Dragons
⚔ Weapons
🛡 Armours

Commands:

s dragons
s weapons
s armours
`)

}


/* ================= DRAGON SHOP ================= */

if(cmd==="dragons"){

msg.channel.send(`
🐉 **DRAGON SHOP**

🔥 Fire Dragon — 4,000,000
⚡ Lightning Dragon — 6,000,000
🌪 Wind Dragon — 7,000,000
❄ Ice Dragon — 9,000,000

Buy using:

s buy dragon fire
s buy dragon lightning
s buy dragon wind
s buy dragon ice
`)

}


/* ================= WEAPON SHOP ================= */

if(cmd==="weapons"){

msg.channel.send(`
⚔ **WEAPON SHOP**

🔥 Fire Sword — 1,000,000
⚡ Lightning Blade — 1,000,000
🌪 Wind Katana — 1,000,000
❄ Ice Spear — 1,000,000

Buy using:

s buy weapon fire
`)

}


/* ================= ARMOUR SHOP ================= */

if(cmd==="armours"){

msg.channel.send(`
🛡 **ARMOUR SHOP**

🔥 Fire Armour — 500,000
⚡ Lightning Armour — 500,000
🌪 Wind Armour — 500,000
❄ Ice Armour — 500,000

Buy using:

s buy armour fire
`)

}


/* ================= BUY SYSTEM ================= */

if(cmd==="buy"){

let type = args[0]
let name = args[1]

/* BUY DRAGON */

if(type==="dragon"){

let price = 4000000

if(user.wallet < price) return msg.reply("❌ Not enough coins")

user.wallet -= price

user.inventory.dragons.push(name)

save()

msg.reply(`
🐉 **DRAGON PURCHASED**

Dragon: **${name}**
Cost: **${price}**
`)

}

/* BUY WEAPON */

if(type==="weapon"){

let price = 1000000

if(user.wallet < price) return msg.reply("❌ Not enough coins")

user.wallet -= price

user.inventory.weapons.push(name)

save()

msg.reply(`
⚔ **WEAPON PURCHASED**

Weapon: **${name}**
`)

}

/* BUY ARMOUR */

if(type==="armour"){

let price = 500000

if(user.wallet < price) return msg.reply("❌ Not enough coins")

user.wallet -= price

user.inventory.armours.push(name)

save()

msg.reply(`
🛡 **ARMOUR PURCHASED**

Armour: **${name}**
`)

}

}


/* ================= SET DRAGON ================= */

if(cmd==="set"){

let dragon = args[0]

if(!dragon) return msg.reply("❌ Enter dragon name")

if(!user.inventory.dragons.includes(dragon))
return msg.reply("❌ You don't own this dragon")

user.dragon = dragon

save()

msg.reply(`
🐉 **ACTIVE DRAGON**

Dragon set to **${dragon}**
`)

}


/* ================= DRAGON INFO ================= */

if(cmd==="dragon"){

if(!user.dragon) return msg.reply("❌ You have no dragon equipped")

msg.channel.send(`
🐉 **YOUR DRAGON**

Name: **${user.dragon}**

Level: **${user.level}**

Use:
s feed
to level up dragon
`)

}


/* ================= FEED DRAGON ================= */

if(cmd==="feed"){

if(!user.dragon) return msg.reply("❌ No dragon selected")

if(user.gems < 100) return msg.reply("❌ Need 100 gems")

user.gems -= 100

user.level += 1

save()

msg.channel.send(`
🐉 **DRAGON LEVEL UP**

Dragon: **${user.dragon}**

New Level: **${user.level}**
`)

}
/* ================= BATTLE CHALLENGE ================= */

let challenges = {}

if(cmd==="challenge"){

let opponent = msg.mentions.users.first()

if(!opponent) return msg.reply("❌ Mention user")

if(opponent.id === msg.author.id)
return msg.reply("❌ You can't challenge yourself")

let user1 = getUser(msg.author.id)
let user2 = getUser(opponent.id)

if(!user1.dragon)
return msg.reply("❌ You need a dragon to battle")

if(!user2.dragon)
return msg.reply("❌ Opponent has no dragon")

challenges[opponent.id] = msg.author.id

msg.channel.send(`
⚔ **DRAGON BATTLE REQUEST**

👤 Challenger: ${msg.author}
👤 Opponent: ${opponent}

Type:

s accept
`)

}



/* ================= ACCEPT BATTLE ================= */

if(cmd==="accept"){

let challengerID = challenges[msg.author.id]

if(!challengerID)
return msg.reply("❌ No challenge found")

let challenger = await client.users.fetch(challengerID)

let p1 = getUser(challengerID)
let p2 = getUser(msg.author.id)

delete challenges[msg.author.id]

msg.channel.send(`
⚔ **DRAGON BATTLE**

🟥 ${msg.author.username}
🐉 ${p2.dragon}
Lvl: ${p2.level}

VS

🟦 ${challenger.username}
🐉 ${p1.dragon}
Lvl: ${p1.level}

🔥 Battle starting...
`)

/* BATTLE ANIMATION */

setTimeout(()=>{

msg.channel.send("⚔ Dragons attacking...")

},2000)

setTimeout(()=>{

msg.channel.send("💥 Massive damage!")

},4000)

/* POWER CALCULATION */

setTimeout(()=>{

let power1 = p1.level + Math.floor(Math.random()*50)
let power2 = p2.level + Math.floor(Math.random()*50)

let winner
let loser

if(power1 > power2){

winner = challenger
loser = msg.author

p1.wins++
p2.loses++

p1.gems += 10

}else{

winner = msg.author
loser = challenger

p2.wins++
p1.loses++

p2.gems += 10

}

save()

msg.channel.send(`
🏆 **BATTLE RESULT**

👑 Winner: ${winner}

💎 Reward: 10 Gems
`)

},6000)

}



/* ================= GLOBAL LEADERBOARD COINS ================= */

if(cmd==="lb" && args[0]==="c"){

let sorted = Object.entries(users)
.sort((a,b)=> (b[1].wallet+b[1].bank) - (a[1].wallet+a[1].bank))
.slice(0,10)

let text="🏆 **GLOBAL COIN LEADERBOARD**\n\n"

for(let i=0;i<sorted.length;i++){

let id = sorted[i][0]
let data = sorted[i][1]

text+=`${i+1}. <@${id}> — ${data.wallet + data.bank} coins\n`

}

msg.channel.send(text)

}



/* ================= GLOBAL BATTLE LEADERBOARD ================= */

if(cmd==="lb" && args[0]==="b"){

let sorted = Object.entries(users)
.sort((a,b)=> b[1].wins - a[1].wins)
.slice(0,10)

let text="⚔ **GLOBAL BATTLE LEADERBOARD**\n\n"

for(let i=0;i<sorted.length;i++){

let id = sorted[i][0]
let data = sorted[i][1]

text+=`${i+1}. <@${id}> — ${data.wins} wins\n`

}

msg.channel.send(text)

}



/* ================= SAVE DATABASE ================= */

process.on("exit",()=>{

save()

})



/* ================= LOGIN ================= */

client.login(process.env.TOKEN)
