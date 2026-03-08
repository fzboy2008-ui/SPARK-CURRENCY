/* ================= IMPORTS ================= */

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js")
const fs = require("fs")
require("dotenv").config()

/* ================= CLIENT ================= */

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

/* ================= PREFIX ================= */

const PREFIXES = ["s ","S ","spark ","Spark "]

/* ================= OWNER ================= */

const OWNER_ID = "1266728371719508062"

/* ================= DATABASE ================= */

if(!fs.existsSync("./database")) fs.mkdirSync("./database")

if(!fs.existsSync("./database/users.json"))
fs.writeFileSync("./database/users.json","{}")

let users = JSON.parse(fs.readFileSync("./database/users.json"))

function save(){
fs.writeFileSync("./database/users.json",JSON.stringify(users,null,2))
}

function getUser(id){

if(!users[id]){

users[id] = {

wallet:0,
bank:0,
gems:0,

xp:0,
rank:0,

dragon:null,
weapon:null,
armour:null,

inventory:{
dragons:[],
weapons:[],
armours:[]
},

wins:0,
loses:0,

lastDaily:0,
currentChallenge:null,

isAdmin:false

}

}

return users[id]

}

/* ================= DRAGONS ================= */

const dragons = {

grog:{name:"Grog",emoji:"🪨",element:"Earth",basePower:50},
phoenix:{name:"Phoenix",emoji:"🔥",element:"Fire",basePower:60},
triton:{name:"Triton",emoji:"🌊",element:"Water",basePower:55},
rex:{name:"Rex",emoji:"⚡",element:"Lightning",basePower:70},
zephyr:{name:"Zephyr",emoji:"🌪️",element:"Wind",basePower:65}

}

/* ================= WEAPONS ================= */

const weapons = {

"flame sword":{attack:15},
"thunder blade":{attack:20},
"aqua spear":{attack:17},
"stone hammer":{attack:22},
"wind dagger":{attack:12}

}

/* ================= ARMOURS ================= */

const armours = {

"dragon plate":{defense:15},
"thunder guard":{defense:20},
"aqua shield":{defense:17},
"earth armor":{defense:22},
"zephyr cloak":{defense:12}

}

/* ================= READY ================= */

client.once("ready",()=>{

console.log("⚡ Spark Bot Online as ${client.user.tag}")

})

/* ================= MAIN MESSAGE HANDLER ================= */

client.on("messageCreate",async message=>{

if(message.author.bot) return

const prefixUsed = PREFIXES.find(p=>message.content.toLowerCase().startsWith(p.toLowerCase()))
if(!prefixUsed) return

const args = message.content.slice(prefixUsed.length).trim().split(/ +/)
const cmd = args.shift()?.toLowerCase()

const user = getUser(message.author.id)

/* ================= XP SYSTEM ================= */

user.xp += 1

const neededXP = 2500

if(user.xp >= neededXP){

user.xp -= neededXP
user.rank += 1

user.wallet += 5000
user.gems += 5

message.channel.send("🏆 **RANK UP!** ${message.author} reached Rank **${user.rank}** 💰 +5000 coins 💎 +5 gems")

}

/* ================= BALANCE ================= */

if(cmd === "bal" || cmd === "balance"){

return message.reply(`💰 ${message.author.username} Balance

💼 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}`)

}

/* ================= DAILY ================= */

if(cmd === "daily"){

const now = Date.now()
const cooldown = 86400000

if(now - user.lastDaily < cooldown){

const remaining = cooldown - (now-user.lastDaily)
const hours = Math.floor(remaining/3600000)
const minutes = Math.floor((remaining%3600000)/60000)

return message.reply("⏳ Daily already claimed Next claim in ${hours}h ${minutes}m")

}

user.wallet += 1000
user.lastDaily = now

save()

return message.reply("🎁 Daily reward: +1000 coins")

}

/* ================= DEPOSIT ================= */

if(cmd === "deposit"){

let amount = args[0]

if(amount==="all") amount = user.wallet

amount = parseInt(amount)

if(isNaN(amount) || amount<=0)
return message.reply("❌ Invalid amount")

if(amount>user.wallet)
return message.reply("❌ Not enough wallet coins")

user.wallet -= amount
user.bank += amount

save()

return message.reply("🏦 Deposited ${amount} coins")

}

/* ================= WITHDRAW ================= */

if(cmd === "withdraw"){

let amount = args[0]

if(amount==="all") amount = user.bank

amount = parseInt(amount)

if(isNaN(amount) || amount<=0)
return message.reply("❌ Invalid amount")

if(amount>user.bank)
return message.reply("❌ Not enough bank coins")

user.bank -= amount
user.wallet += amount

save()

return message.reply("💸 Withdrawn ${amount} coins")

}

/* ================= GIVE ================= */

if(cmd === "give"){

const target = message.mentions.users.first()
let amount = parseInt(args[1])

if(!target)
return message.reply("❌ Mention user")

if(isNaN(amount) || amount<=0)
return message.reply("❌ Invalid amount")

if(amount>user.wallet)
return message.reply("❌ Not enough coins")

const tUser = getUser(target.id)

user.wallet -= amount
tUser.wallet += amount

save()

return message.reply("💸 Sent ${amount} coins to ${target.username}")

}

/* ================= COINFLIP ================= */

if(cmd === "cf" || cmd==="coinflip"){

let bet = parseInt(args[0])
let choice = args[1]

if(isNaN(bet) || bet<=0)
return message.reply("❌ Invalid bet")

if(bet>user.wallet)
return message.reply("❌ Not enough coins")

const sides=["heads","tails"]

if(!sides.includes(choice))
return message.reply("Choose heads or tails")

let result = sides[Math.floor(Math.random()*2)]

if(result===choice){

user.wallet += bet

message.reply("🪙 Result: ${result} ✅ You won ${bet}")

}else{

user.wallet -= bet

message.reply("🪙 Result: ${result} ❌ You lost ${bet}")

}

save()

}

/* ================= SLOT ================= */

if(cmd === "slot"){

let bet = parseInt(args[0])

if(isNaN(bet)||bet<=0)
return message.reply("❌ Invalid bet")

if(bet>user.wallet)
return message.reply("❌ Not enough coins")

const symbols=["💎","🍉","🥭"]

let roll=[
symbols[Math.floor(Math.random()*3)],
symbols[Math.floor(Math.random()*3)],
symbols[Math.floor(Math.random()*3)]
]

let payout=0

if(roll.every(s=>s===roll[0])){

if(roll[0]==="💎") payout=bet3
if(roll[0]==="🥭") payout=bet2
if(roll[0]==="🍉") payout=bet

}

if(payout>0){

user.wallet += payout
message.reply("🎰 ${roll.join(" | ")} ✅ Won ${payout}")

}else{

user.wallet -= bet
message.reply("🎰 ${roll.join(" | ")} ❌ Lost ${bet}")

}

save()

}

/* ================= INVENTORY ================= */

if(cmd==="inv"){

return message.reply(`📦 Inventory

🐉 Dragons:
${user.inventory.dragons.join(", ")||"None"}

🗡 Weapons:
${user.inventory.weapons.join(", ")||"None"}

🛡 Armours:
${user.inventory.armours.join(", ")||"None"}`)

}

/* ================= SHOP ================= */

if(cmd==="shop"){

return message.channel.send(`🛒 SHOP

Dragons:
${Object.keys(dragons).join(", ")}

Weapons:
${Object.keys(weapons).join(", ")}

Armours:
${Object.keys(armours).join(", ")}

Buy with:
s buy <category> <name>`)

}

/* ================= BUY ================= */

if(cmd==="buy"){

const category=args[0]
const name=args.slice(1).join(" ").toLowerCase()

if(category==="dragon"){

if(!dragons[name])
return message.reply("Dragon not found")

if(user.inventory.dragons.includes(name))
return message.reply("Already owned")

let price=5000000

if(user.wallet<price)
return message.reply("Not enough coins")

user.wallet -= price
user.inventory.dragons.push(name)

save()

return message.reply("🐉 Bought ${name}")

}

}

/* ================= HELP ================= */

if(cmd==="help"){

return message.reply(`⚡ Commands

Economy:
s bal
s deposit
s withdraw
s give
s daily

Games:
s cf
s slot

Battle:
s challenge
s accept

Inventory:
s inv
s shop
s buy
s set

Leaderboards:
s lb balance
s lb battles`)

}

save()

})

/* ================= LOGIN ================= */

client.login(process.env.TOKEN)
