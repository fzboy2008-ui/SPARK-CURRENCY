const { 
Client,
GatewayIntentBits,
EmbedBuilder,
ButtonBuilder,
ButtonStyle,
ActionRowBuilder
} = require("discord.js");

const fs = require("fs");

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
]
});

const prefix = "s";

let economy = {};

if(fs.existsSync("./economy.json")){
economy = JSON.parse(fs.readFileSync("./economy.json"))
}

function save(){
fs.writeFileSync("./economy.json",JSON.stringify(economy,null,2))
}

client.on("ready",()=>{
console.log(`${client.user.tag} Online`)
})

client.on("messageCreate", async message=>{

if(message.author.bot) return
if(!message.content.startsWith(prefix)) return

const args = message.content.slice(prefix.length).trim().split(/ +/)
const cmd = args.shift().toLowerCase()

if(!economy[message.author.id]){
economy[message.author.id] = {cash:500,bank:0}
}

let user = economy[message.author.id]

/* BALANCE */

if(cmd === "bal"){

const embed = new EmbedBuilder()
.setTitle("💰 Balance")
.setColor("Gold")
.setDescription(`
Cash: **${user.cash}**
Bank: **${user.bank}**
`)

message.reply({embeds:[embed]})
}

/* DAILY */

if(cmd === "daily"){

let amount = 500

user.cash += amount
save()

message.reply(`💰 You received **${amount} coins**`)
}

/* DEPOSIT */

if(cmd === "deposit"){

let amount = parseInt(args[0])

if(!amount) return message.reply("Enter amount")

if(user.cash < amount) return message.reply("Not enough cash")

user.cash -= amount
user.bank += amount

save()

message.reply(`🏦 Deposited **${amount}**`)
}

/* WITHDRAW */

if(cmd === "withdraw"){

let amount = parseInt(args[0])

if(user.bank < amount) return message.reply("Not enough bank")

user.bank -= amount
user.cash += amount

save()

message.reply(`💵 Withdraw **${amount}**`)
}

/* PROFILE */

if(cmd === "profile"){

const embed = new EmbedBuilder()
.setTitle(`👤 ${message.author.username}`)
.setDescription(`
💰 Cash: ${user.cash}
🏦 Bank: ${user.bank}
⚔ Level: 1
`)

message.reply({embeds:[embed]})
}

/* SHOP */

if(cmd === "shop"){

const embed = new EmbedBuilder()
.setTitle("🛒 RPG Shop")
.setDescription(`
🗡 Sword — 500
🛡 Shield — 400
🏹 Bow — 300
`)

const buy = new ButtonBuilder()
.setCustomId("buy_sword")
.setLabel("Buy Sword")
.setStyle(ButtonStyle.Primary)

const row = new ActionRowBuilder().addComponents(buy)

message.reply({embeds:[embed],components:[row]})
}

})

client.on("interactionCreate", async interaction=>{

if(!interaction.isButton()) return

if(interaction.customId === "buy_sword"){

interaction.reply("🗡 You bought a sword")
}

})

client.login(process.env.TOKEN)
