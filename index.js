const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");

const prefix = "s";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let data = {};
let disabledChannels = [];

if (fs.existsSync("./data.json")) {
  data = JSON.parse(fs.readFileSync("./data.json"));
}

function saveData() {
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
}

client.once("ready", () => {
  console.log(`Bot Online: ${client.user.tag}`);
});

function createUser(id) {
  if (!data[id]) {
    data[id] = {
      xp: 0,
      rank: 1,
      coins: 0,
      gems: 0,
      bank: 0,
      dragon: null,
      weapon: null,
      armour: null,
      dragons: [],
      weapons: [],
      armours: [],
      battles: 0
    };
  }
}

client.on("messageCreate", async (message) => {

  if (message.author.bot) return;

  const userId = message.author.id;

  createUser(userId);

  // XP SYSTEM
  data[userId].xp += 1;

  const neededXP = data[userId].rank * 2500;

  if (data[userId].xp >= neededXP && data[userId].rank < 50) {

    data[userId].rank += 1;

    const reward = data[userId].rank * 5000;

    data[userId].coins += reward;

    message.channel.send(
      `🎉 ${message.author} ranked up to Rank ${data[userId].rank}\nReward: ${reward} coins`
    );

  }

  saveData();

  if (!message.content.startsWith(prefix)) return;

  if (disabledChannels.includes(message.channel.id)) {
    return message.reply("This channel is disabled for this bot.");
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);

  const command = args.shift().toLowerCase();
// ================= ECONOMY SYSTEM =================

const fs = require("fs")
const DB_FILE = "./database.json"

function loadDB(){
if(!fs.existsSync(DB_FILE)){
fs.writeFileSync(DB_FILE, JSON.stringify({}))
}
return JSON.parse(fs.readFileSync(DB_FILE))
}

function saveDB(data){
fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2))
}

function getUser(id){
let db = loadDB()

if(!db[id]){
db[id] = {
gems: 0,
wins: 0,
loses: 0
}
saveDB(db)
}

return db[id]
}

function updateUser(id,data){
let db = loadDB()
db[id] = data
saveDB(db)
}
// ================= BATTLE SYSTEM =================

client.on("messageCreate", async message => {

if(message.author.bot) return

const args = message.content.split(" ")
const command = args[0]

if(command === "!battle"){

const opponent = message.mentions.users.first()

if(!opponent){
return message.reply("⚔️ | Mention a user to battle!")
}

if(opponent.bot){
return message.reply("🤖 | You can't battle a bot!")
}

if(opponent.id === message.author.id){
return message.reply("😅 | You can't battle yourself!")
}

let user1 = getUser(message.author.id)
let user2 = getUser(opponent.id)

let winner = Math.random() < 0.5 ? message.author : opponent
let loser = winner.id === message.author.id ? opponent : message.author

let winData = getUser(winner.id)
let loseData = getUser(loser.id)

winData.gems += 25
winData.wins += 1

loseData.gems -= 5
loseData.loses += 1

updateUser(winner.id, winData)
updateUser(loser.id, loseData)

message.channel.send(
`⚔️ **Battle Result**

🏆 Winner: <@${winner.id}> (+25 💎)

💀 Loser: <@${loser.id}> (-5 💎)
`
)

}

})
// ================= USER COMMANDS =================

client.on("messageCreate", async message => {

if(message.author.bot) return

const args = message.content.split(" ")
const command = args[0]

// SHOW USER COMMANDS

if(command === "!cmds"){

message.channel.send(`
📜 **USER COMMANDS**

⚔️ !battle @user
Start a battle with another player

💎 !gems
Check your gems balance

📜 !cmds
Show user commands
`)
}

// CHECK GEMS

if(command === "!gems"){

let user = getUser(message.author.id)

message.reply(`💎 | You have **${user.gems} Gems**`)
}

})
// ================= ADMIN COMMANDS =================

client.on("messageCreate", async message => {

if(message.author.bot) return

const args = message.content.split(" ")
const command = args[0]

// ADMIN CHECK
if(!message.member.permissions.has("Administrator")) return

// ADD GEMS

if(command === "!addgems"){

const user = message.mentions.users.first()
const amount = parseInt(args[2])

if(!user) return message.reply("Mention a user")
if(!amount) return message.reply("Enter gem amount")

let data = getUser(user.id)

data.gems += amount

updateUser(user.id,data)

message.channel.send(`✅ Added **${amount} Gems** to <@${user.id}>`)
}

// REMOVE GEMS

if(command === "!removegems"){

const user = message.mentions.users.first()
const amount = parseInt(args[2])

if(!user) return message.reply("Mention a user")
if(!amount) return message.reply("Enter gem amount")

let data = getUser(user.id)

data.gems -= amount

updateUser(user.id,data)

message.channel.send(`❌ Removed **${amount} Gems** from <@${user.id}>`)
}

})


// ================= BOT LOGIN =================

client.login(process.env.TOKEN)
