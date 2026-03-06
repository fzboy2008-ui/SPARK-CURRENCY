import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js"
import { QuickDB } from "quick.db"

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]})

const db = new QuickDB()

const prefix="s "
const OWNER="fzboy786_01978"

const DRAGONS=[
{name:"Fire Dragon",price:4000000},
{name:"Ice Dragon",price:5000000},
{name:"Shadow Dragon",price:6000000}
]

client.once("ready",()=>{
console.log("SPARK BOT READY")
})

client.on("messageCreate",async message=>{

if(message.author.bot) return
if(!message.content.startsWith(prefix)) return

const args=message.content.slice(prefix.length).trim().split(/ +/)
const cmd=args.shift().toLowerCase()

const user=message.author

let wallet=await db.get(`wallet_${user.id}`)||0
let bank=await db.get(`bank_${user.id}`)||0
let gems=await db.get(`gems_${user.id}`)||0
let battles=await db.get(`battles_${user.id}`)||0

// HELP

if(cmd==="help"){

const embed=new EmbedBuilder()

.setTitle("📜 SPARK COMMANDS")

.setDescription(`

💰 ECONOMY
s daily
s cash
s cf <amount>

🐉 DRAGON
s dragon
s dragon buy <name>
s dragon set <name>
s feed

⚔ BATTLE
s challenge @user
s accept

🛒 SHOP
s shop
s inv

🏆 LEADERBOARD
s lb coins
s lb battles

`)

.setColor("Gold")

return message.reply({embeds:[embed]})
}

// CASH

if(cmd==="cash"){

const embed=new EmbedBuilder()

.setTitle(`💰 ${user.username}`)

.setDescription(`
👛 Wallet : **${wallet}**

🏦 Bank : **${bank}**

💎 Gems : **${gems}**
`)

.setColor("Green")

return message.reply({embeds:[embed]})
}

// DAILY

if(cmd==="daily"){

await db.add(`wallet_${user.id}`,500)

return message.reply("🎁 You received **500 coins**")
}

// COINFLIP

if(cmd==="cf"){

let bet=args[0]

if(bet==="all") bet=wallet

bet=parseInt(bet)

if(wallet<bet) return message.reply("❌ Not enough coins")

const win=Math.random()<0.5

if(win){

await db.add(`wallet_${user.id}`,bet)

return message.reply(`🪙 WIN +${bet}`)

}else{

await db.sub(`wallet_${user.id}`,bet)

return message.reply(`💀 LOSE -${bet}`)

}

}

// DRAGON LIST

if(cmd==="dragon"){

if(!args[0]){

let owned=await db.get(`dragons_${user.id}`)||[]

return message.reply(`🐉 Your Dragons:\n${owned.join("\n")||"None"}`)
}

if(args[0]==="buy"){

let name=args.slice(1).join(" ")

let dragon=DRAGONS.find(d=>d.name.toLowerCase()===name.toLowerCase())

if(!dragon) return message.reply("Dragon not found")

if(wallet<dragon.price) return message.reply("❌ Not enough coins")

await db.sub(`wallet_${user.id}`,dragon.price)

let owned=await db.get(`dragons_${user.id}`)||[]

owned.push(dragon.name)

await db.set(`dragons_${user.id}`,owned)

return message.reply(`🐉 You bought **${dragon.name}**`)
}

if(args[0]==="set"){

let name=args.slice(1).join(" ")

await db.set(`selected_${user.id}`,name)

return message.reply(`🐉 Selected Dragon: ${name}`)
}

}

// FEED

if(cmd==="feed"){

if(gems<100) return message.reply("❌ Need 100 gems")

await db.sub(`gems_${user.id}`,100)

let lvl=await db.get(`dragonlvl_${user.id}`)||1

lvl++

await db.set(`dragonlvl_${user.id}`,lvl)

return message.reply(`🍖 Dragon upgraded to **LVL ${lvl}**`)
}

// CHALLENGE

if(cmd==="challenge"){

let opponent=message.mentions.users.first()

if(!opponent) return message.reply("Mention user")

await db.set(`challenge_${opponent.id}`,user.id)

return message.reply(`⚔ ${opponent} type **s accept**`)
}

// ACCEPT

if(cmd==="accept"){

let challenger=await db.get(`challenge_${user.id}`)

if(!challenger) return message.reply("No challenge")

let win=Math.random()<0.5

if(win){

await db.add(`gems_${user.id}`,5)

await db.add(`battles_${user.id}`,1)

return message.reply("🏆 You won the battle +5 gems")

}else{

await db.add(`battles_${challenger}`,1)

return message.reply("💀 You lost")
}

}

// INVENTORY

if(cmd==="inv"){

let dragons=await db.get(`dragons_${user.id}`)||[]

const embed=new EmbedBuilder()

.setTitle("🎒 Inventory")

.setDescription(`

🐉 Dragons
${dragons.join("\n")||"None"}

🗡 Weapons
Coming Soon

🛡 Armours
Coming Soon

💎 Gems
${gems}

`)

.setColor("Purple")

return message.reply({embeds:[embed]})
}

// SHOP

if(cmd==="shop"){

const embed=new EmbedBuilder()

.setTitle("🛒 SHOP")

.setDescription(`

🐉 Dragons
Fire Dragon — 4M
Ice Dragon — 5M
Shadow Dragon — 6M

🗡 Weapons
1M each

🛡 Armours
500K each

`)

.setColor("Orange")

return message.reply({embeds:[embed]})
}

// LEADERBOARD

if(cmd==="lb"){

let type=args[0]

let data=await db.all()

let users=data
.filter(x=>x.id.startsWith(type==="coins"?"wallet_":"battles_"))
.sort((a,b)=>b.value-a.value)
.slice(0,10)

let text=""

users.forEach((u,i)=>{

let id=u.id.split("_")[1]

text+=`${i+1}. <@${id}> — ${u.value}\n`

})

return message.reply(`🏆 Leaderboard\n${text}`)
}

// OWNER COMMANDS

if(user.username===OWNER){

if(cmd==="admin"){

if(args[0]==="add"){

let target=message.mentions.users.first()

let admins=await db.get("admins")||[]

admins.push(target.id)

await db.set("admins",admins)

return message.reply(`👑 Admin added`)
}

if(args[0]==="list"){

let admins=await db.get("admins")||[]

return message.reply(`👑 Admins\n${admins.map(a=>`<@${a}>`).join("\n")}`)
}

}

if(cmd==="setmoney"){

let target=message.mentions.users.first()

let amount=parseInt(args[1])

await db.set(`wallet_${target.id}`,amount)

return message.reply("💰 Money set")
}

if(cmd==="reset"){

if(args[0]==="all"){

await db.deleteAll()

return message.reply("⚠ Database reset")

}

}

}

})

client.login("YOUR_BOT_TOKEN")
