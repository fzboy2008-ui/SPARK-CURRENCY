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

const prefixes = ["s","S","spark","Spark","SPARK"];

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

const prefix = prefixes.find(p => message.content.startsWith(p))
if(!prefix) return

const args = message.content.slice(prefix.length).trim().split(/ +/)
const cmd = args.shift().toLowerCase()

if(!economy[message.author.id]){
economy[message.author.id] = {cash:0,bank:0}
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

return message.reply({embeds:[embed]})
}

/* DAILY */

if(cmd === "daily"){

let amount = 100000

user.cash += amount
save()

return message.reply(`💰 You received **${amount} coins**`)
}

/* SHOP */

if(cmd === "shop"){

const embed = new EmbedBuilder()
.setTitle("🛒 ELEMENT SHOP")
.setDescription("Select a category")

const dragon = new ButtonBuilder()
.setCustomId("shop_dragon")
.setLabel("🐉 Dragon")
.setStyle(ButtonStyle.Primary)

const armour = new ButtonBuilder()
.setCustomId("shop_armour")
.setLabel("🛡️ Armour")
.setStyle(ButtonStyle.Success)

const weapon = new ButtonBuilder()
.setCustomId("shop_weapon")
.setLabel("⚔️ Weapon")
.setStyle(ButtonStyle.Danger)

const row = new ActionRowBuilder().addComponents(dragon,armour,weapon)

return message.reply({embeds:[embed],components:[row]})
}

})

client.on("interactionCreate", async interaction=>{

if(!interaction.isButton()) return

/* DRAGON SHOP */

if(interaction.customId === "shop_dragon"){

const embed = new EmbedBuilder()
.setTitle("🐉 DRAGON SHOP")
.setDescription(`
1️⃣ 🔥 Inferno Dragon
2️⃣ 🌊 Abyss Dragon
3️⃣ ⚡ Storm Dragon
4️⃣ 🍃 Tempest Dragon
5️⃣ 🪨 Titan Dragon

💰 Price: **8000 coins**
`)

return interaction.reply({embeds:[embed]})
}

/* ARMOUR SHOP */

if(interaction.customId === "shop_armour"){

const embed = new EmbedBuilder()
.setTitle("🛡️ ARMOUR SHOP")
.setDescription(`
1️⃣ 🔥 Flame Armour
2️⃣ 🌊 Ocean Guard
3️⃣ ⚡ Thunder Plate
4️⃣ 🍃 Wind Cloak
5️⃣ 🪨 Earth Defender

💰 Price: **6000 coins**
`)

return interaction.reply({embeds:[embed]})
}

/* WEAPON SHOP */

if(interaction.customId === "shop_weapon"){

const embed = new EmbedBuilder()
.setTitle("⚔️ WEAPON SHOP")
.setDescription(`
1️⃣ 🔥 Flame Blade
2️⃣ 🌊 Tide Trident
3️⃣ ⚡ Thunder Spear
4️⃣ 🍃 Wind Katana
5️⃣ 🪨 Earth Hammer

💰 Price: **5000 coins**
`)

return interaction.reply({embeds:[embed]})
}

})

client.login(process.env.TOKEN)
