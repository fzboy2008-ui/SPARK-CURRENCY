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

const prefixes = ["s","S","spark","Spark","SPARK"];

let economy = {};

if(fs.existsSync("./economy.json")){
economy = JSON.parse(fs.readFileSync("./economy.json"))
}

function save(){
fs.writeFileSync("./economy.json",JSON.stringify(economy,null,2))
}

function formatTime(ms){

let seconds = Math.floor(ms/1000)%60
let minutes = Math.floor(ms/(1000*60))%60
let hours = Math.floor(ms/(1000*60*60))

return `${hours}h ${minutes}m ${seconds}s`
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

})

client.login(process.env.TOKEN)
