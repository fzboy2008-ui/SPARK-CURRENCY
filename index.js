const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const prefixes = ["s","S","spark","Spark","SPARK"];
const maxBet = 100000;

let economy = {};

if(fs.existsSync("./economy.json")){
economy = JSON.parse(fs.readFileSync("./economy.json"))
}

function save(){
fs.writeFileSync("./economy.json",JSON.stringify(economy,null,2))
}

function formatTime(ms){
let s = Math.floor(ms/1000)%60
let m = Math.floor(ms/(1000*60))%60
let h = Math.floor(ms/(1000*60*60))
return `${h}h ${m}m ${s}s`
}

client.on("ready",()=>{
console.log(`${client.user.tag} Online`)
})

client.on("messageCreate", async message=>{

if(message.author.bot) return

const prefix = prefixes.find(p => message.content.startsWith(p))
if(!prefix) return

const args = message.content.slice(prefix.length).trim().split(/ +/)
const cmd = args.shift().toLowerCase()

if(!economy[message.author.id]){
economy[message.author.id] = {
wallet:0,
bank:0,
gems:0,
daily:0
}
}

let user = economy[message.author.id]

/* BAL */

if(cmd === "bal"){

const embed = new EmbedBuilder()
.setColor("#2b2d31")
.setDescription(`
👤 ${message.author.username}

💵 **Wallet :** ${user.wallet}
🏦 **Bank   :** ${user.bank}
💎 **Gems   :** ${user.gems}
`)
.setFooter({text:"SPARK BOT V1 UPDATE"})

return message.reply({embeds:[embed]})
}

/* DAILY */

if(cmd === "daily"){

let cooldown = 86400000

if(Date.now() - user.daily < cooldown){

let timeLeft = formatTime(cooldown - (Date.now() - user.daily))

const embed = new EmbedBuilder()
.setColor("Red")
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You already claimed today's reward.

⏱ **Next Daily In**
${timeLeft}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
.setFooter({text:"SPARK BOT V1 UPDATE"})

return message.reply({embeds:[embed]})

}

let reward = 1000

user.wallet += reward
user.daily = Date.now()

save()

const embed = new EmbedBuilder()
.setColor("Gold")
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 **Reward : ${reward} Coins**

💵 **Wallet : ${user.wallet}**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
.setFooter({text:"SPARK BOT V1 UPDATE"})

return message.reply({embeds:[embed]})

}

/* DEPOSIT */

if(cmd === "deposit"){

let amount = parseInt(args[0])

if(!amount) return message.reply("Enter amount")
if(user.wallet < amount) return message.reply("Not enough coins")

user.wallet -= amount
user.bank += amount

save()

const embed = new EmbedBuilder()
.setColor("Green")
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏦 **Deposit Successful**

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
.setFooter({text:"SPARK BOT V1 UPDATE"})

return message.reply({embeds:[embed]})

}

/* WITHDRAW */

if(cmd === "withdraw"){

let amount = parseInt(args[0])

if(!amount) return message.reply("Enter amount")
if(user.bank < amount) return message.reply("Not enough bank balance")

user.bank -= amount
user.wallet += amount

save()

const embed = new EmbedBuilder()
.setColor("Green")
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💵 **Withdraw Successful**

💵 Wallet : ${user.wallet}
🏦 Bank   : ${user.bank}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
.setFooter({text:"SPARK BOT V1 UPDATE"})

return message.reply({embeds:[embed]})

}

/* GIVE */

if(cmd === "give"){

let member = message.mentions.users.first()
let amount = parseInt(args[1])

if(!member) return message.reply("Mention a user")
if(!amount) return message.reply("Enter amount")
if(user.wallet < amount) return message.reply("Not enough coins")

if(!economy[member.id]){
economy[member.id] = {wallet:0,bank:0,gems:0,daily:0}
}

economy[member.id].wallet += amount
user.wallet -= amount

save()

const embed = new EmbedBuilder()
.setColor("Blue")
.setDescription(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💸 **Transfer Successful**

Sender  : ${message.author.username}
Receiver: ${member.username}

Amount  : ${amount} Coins

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
.setFooter({text:"SPARK BOT V1 UPDATE"})

return message.reply({embeds:[embed]})

}

/* COIN FLIP */

if(cmd === "cf"){

let bet = args[0]

if(!bet) return message.reply("Enter bet amount")

if(bet === "all") bet = Math.min(user.wallet,maxBet)
else bet = Math.min(parseInt(bet),maxBet)

if(user.wallet < bet) return message.reply("Not enough coins")

user.wallet -= bet
save()

const msg = await message.reply("🪙 Flipping coin...")

await new Promise(r=>setTimeout(r,1500))

let win = Math.random() < 0.25

if(win){

let reward = bet*2
user.wallet += reward

await msg.edit(`
🪙 **HEADS**

🎉 You Won **${reward}**
`)

}else{

await msg.edit(`
🔘 **TAILS**

❌ You Lost **${bet}**
`)

}

save()

}

/* SLOT */

if(cmd === "slot"){

let bet = args[0]

if(!bet) return message.reply("Enter bet")

if(bet === "all") bet = Math.min(user.wallet,maxBet)
else bet = Math.min(parseInt(bet),maxBet)

if(user.wallet < bet) return message.reply("Not enough coins")

user.wallet -= bet
save()

const msg = await message.reply("🎰 Spinning...")

await new Promise(r=>setTimeout(r,1500))

let emojis = ["💎","🍎","🥬","🅾️"]
let result = emojis[Math.floor(Math.random()*emojis.length)]

let reward = 0
let multiplier = 0

if(result==="💎"){ multiplier=3 }
if(result==="🍎"){ multiplier=2 }
if(result==="🥬"){ multiplier=1 }
if(result==="🅾️"){ multiplier=0 }

reward = bet*multiplier

user.wallet += reward

await msg.edit(`
🎰 **SLOT MACHINE**

${result} ${result} ${result}

Multiplier : **${multiplier}x**
Reward : **${reward}**
`)

save()

}

})

client.login(process.env.TOKEN)
