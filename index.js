// ==============================
// SPARK BOT - ALL IN ONE CODE
// PART 1
// ==============================

const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js")
const fs = require("fs")

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

// ==============================
// PREFIX
// ==============================

const prefixes = ["s ", "S ", "spark ", "Spark "]

// ==============================
// DATABASE FILES
// ==============================

if (!fs.existsSync("./data")) {
  fs.mkdirSync("./data")
}

if (!fs.existsSync("./data/users.json")) {
  fs.writeFileSync("./data/users.json", JSON.stringify({}))
}

if (!fs.existsSync("./data/guilds.json")) {
  fs.writeFileSync("./data/guilds.json", JSON.stringify({}))
}

// ==============================
// LOAD DATABASE
// ==============================

let users = JSON.parse(fs.readFileSync("./data/users.json"))

function saveUsers() {
  fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2))
}

// ==============================
// CREATE USER DATA
// ==============================

function createUser(id) {

  if (!users[id]) {

    users[id] = {

      coins: 1000,
      gems: 0,

      bank: 0,

      xp: 0,
      level: 1,

      wins: 0,
      losses: 0,

      lastDaily: 0,

      inventory: []

    }

    saveUsers()
  }

}

// ==============================
// XP SYSTEM
// ==============================

function addXP(id, amount) {

  createUser(id)

  users[id].xp += amount

  let needed = users[id].level * 100

  if (users[id].xp >= needed) {

    users[id].xp = 0
    users[id].level += 1

  }

  saveUsers()

}

// ==============================
// HP BAR FUNCTION
// ==============================

function hpBar(current, max) {

  let percent = current / max

  let bars = Math.round(percent * 6)

  let full = "■".repeat(bars)
  let empty = "□".repeat(6 - bars)

  return `[${full}${empty}] ${Math.floor(percent * 100)}%`

}

// ==============================
// BOT READY
// ==============================

client.once("ready", () => {

  console.log(`⚡ Spark Bot Online: ${client.user.tag}`)

})

// ==============================
// MESSAGE HANDLER
// ==============================

client.on("messageCreate", async message => {

  if (message.author.bot) return

  addXP(message.author.id, 5)

  const prefix = prefixes.find(p =>
    message.content.toLowerCase().startsWith(p.toLowerCase())
  )

  if (!prefix) return

  const args = message.content.slice(prefix.length).trim().split(/ +/)

  const cmd = args.shift()?.toLowerCase()

// ==============================
// COMMANDS START
// ==============================
// ==============================
// PART 2
// ECONOMY COMMANDS
// ==============================

// BALANCE COMMAND
if (cmd === "bal" || cmd === "balance") {

  createUser(message.author.id)

  const user = users[message.author.id]

  const embed = new EmbedBuilder()
    .setTitle("💰 Balance")
    .setDescription(
`👤 **${message.author.username}**

🪙 Coins: **${user.coins}**
💎 Gems: **${user.gems}**
🏦 Bank: **${user.bank}**`
    )
    .setColor("Gold")

  message.reply({ embeds: [embed] })

}

// ==============================
// DAILY COMMAND
// ==============================

if (cmd === "daily") {

  createUser(message.author.id)

  const user = users[message.author.id]

  const now = Date.now()

  const cooldown = 86400000

  if (now - user.lastDaily < cooldown) {

    const time = Math.floor((cooldown - (now - user.lastDaily)) / 1000 / 60)

    return message.reply(`⏳ You already claimed daily.\nCome back in **${time} minutes**.`)

  }

  const reward = Math.floor(Math.random() * 500) + 500

  user.coins += reward

  user.lastDaily = now

  saveUsers()

  const embed = new EmbedBuilder()
    .setTitle("🎁 Daily Reward")
    .setDescription(`You received **${reward} coins**!`)
    .setColor("Green")

  message.reply({ embeds: [embed] })

}

// ==============================
// GIVE COMMAND
// ==============================

if (cmd === "give") {

  const member = message.mentions.users.first()

  const amount = parseInt(args[1])

  if (!member) return message.reply("❌ Mention a user")

  if (member.bot) return message.reply("❌ Cannot give bots")

  if (isNaN(amount) || amount <= 0) return message.reply("❌ Invalid amount")

  createUser(message.author.id)
  createUser(member.id)

  if (users[message.author.id].coins < amount) {
    return message.reply("❌ Not enough coins")
  }

  users[message.author.id].coins -= amount
  users[member.id].coins += amount

  saveUsers()

  message.reply(`✅ Gave **${amount} coins** to **${member.username}**`)

}

// ==============================
// DEPOSIT COMMAND
// ==============================

if (cmd === "deposit" || cmd === "dep") {

  const amount = parseInt(args[0])

  createUser(message.author.id)

  const user = users[message.author.id]

  if (isNaN(amount) || amount <= 0) {
    return message.reply("❌ Invalid amount")
  }

  if (user.coins < amount) {
    return message.reply("❌ Not enough coins")
  }

  user.coins -= amount
  user.bank += amount

  saveUsers()

  message.reply(`🏦 Deposited **${amount} coins**`)

}

// ==============================
// WITHDRAW COMMAND
// ==============================

if (cmd === "withdraw" || cmd === "with") {

  const amount = parseInt(args[0])

  createUser(message.author.id)

  const user = users[message.author.id]

  if (isNaN(amount) || amount <= 0) {
    return message.reply("❌ Invalid amount")
  }

  if (user.bank < amount) {
    return message.reply("❌ Not enough bank balance")
  }

  user.bank -= amount
  user.coins += amount

  saveUsers()

  message.reply(`💰 Withdrew **${amount} coins**`)

}
// ==============================
// PART 3
// RANK SYSTEM + LEADERBOARD
// ==============================

// RANK COMMAND
if (cmd === "rank") {

  createUser(message.author.id)

  const user = users[message.author.id]

  const neededXP = user.level * 100

  const progress = hpBar(user.xp, neededXP)

  const embed = new EmbedBuilder()
    .setTitle("🌟 Rank Card")
    .setDescription(
`👤 **${message.author.username}**

🌟 Level: **${user.level}**
⭐ XP: **${user.xp} / ${neededXP}**

📊 Progress
${progress}

🏆 Wins: **${user.wins}**
💀 Losses: **${user.losses}**`
    )
    .setColor("Blue")

  message.reply({ embeds: [embed] })

}

// ==============================
// COINS LEADERBOARD
// ==============================

if (cmd === "lb" || cmd === "leaderboard") {

  let sorted = Object.entries(users)
    .sort((a, b) => (b[1].coins + b[1].bank) - (a[1].coins + a[1].bank))
    .slice(0, 10)

  let text = ""

  for (let i = 0; i < sorted.length; i++) {

    const id = sorted[i][0]
    const data = sorted[i][1]

    const user = await client.users.fetch(id).catch(() => null)

    if (!user) continue

    text += `**${i + 1}. ${user.username}** — 🪙 ${data.coins + data.bank}\n`

  }

  const embed = new EmbedBuilder()
    .setTitle("🏆 Coins Leaderboard")
    .setDescription(text || "No data")
    .setColor("Gold")

  message.reply({ embeds: [embed] })

}

// ==============================
// GEMS LEADERBOARD
// ==============================

if (cmd === "glb" || cmd === "gemsleaderboard") {

  let sorted = Object.entries(users)
    .sort((a, b) => b[1].gems - a[1].gems)
    .slice(0, 10)

  let text = ""

  for (let i = 0; i < sorted.length; i++) {

    const id = sorted[i][0]
    const data = sorted[i][1]

    const user = await client.users.fetch(id).catch(() => null)

    if (!user) continue

    text += `**${i + 1}. ${user.username}** — 💎 ${data.gems}\n`

  }

  const embed = new EmbedBuilder()
    .setTitle("💎 Gems Leaderboard")
    .setDescription(text || "No data")
    .setColor("Purple")

  message.reply({ embeds: [embed] })

}
// ==============================
// PART 4
// COINFLIP + SLOT (GAMBLING)
// ==============================

// ==============================
// COINFLIP COMMAND
// WIN CHANCE = 30%
// ==============================

if (cmd === "cf" || cmd === "coinflip") {

  createUser(message.author.id)

  const user = users[message.author.id]

  let bet = args[0]

  if (!bet) return message.reply("❌ Enter bet amount")

  if (bet === "all") {
    bet = user.coins
  } else {
    bet = parseInt(bet)
  }

  if (isNaN(bet) || bet <= 0) {
    return message.reply("❌ Invalid bet")
  }

  if (bet > user.coins) {
    return message.reply("❌ Not enough coins")
  }

  // 30% WIN CHANCE
  const win = Math.random() < 0.30

  if (win) {

    const reward = bet

    user.coins += reward
    user.wins += 1

    saveUsers()

    const embed = new EmbedBuilder()
      .setTitle("🪙 Coinflip")
      .setDescription(
`🎉 **YOU WON!**

Bet: **${bet}**
Reward: **${reward}**

New Balance: **${user.coins}**`
      )
      .setColor("Green")

    message.reply({ embeds: [embed] })

  } else {

    user.coins -= bet
    user.losses += 1

    saveUsers()

    const embed = new EmbedBuilder()
      .setTitle("🪙 Coinflip")
      .setDescription(
`💀 **YOU LOST**

Lost: **${bet}**

Balance: **${user.coins}**`
      )
      .setColor("Red")

    message.reply({ embeds: [embed] })

  }

}

// ==============================
// SLOT COMMAND
// WIN CHANCE = 50%
// ==============================

if (cmd === "slot" || cmd === "slots") {

  createUser(message.author.id)

  const user = users[message.author.id]

  let bet = args[0]

  if (!bet) return message.reply("❌ Enter bet amount")

  if (bet === "all") {
    bet = user.coins
  } else {
    bet = parseInt(bet)
  }

  if (isNaN(bet) || bet <= 0) {
    return message.reply("❌ Invalid bet")
  }

  if (bet > user.coins) {
    return message.reply("❌ Not enough coins")
  }

  const symbols = ["🍒", "🍋", "🍉", "⭐", "💎"]

  function spin() {
    return symbols[Math.floor(Math.random() * symbols.length)]
  }

  const s1 = spin()
  const s2 = spin()
  const s3 = spin()

  const result = `${s1} | ${s2} | ${s3}`

  const win = Math.random() < 0.50

  if (win) {

    const reward = bet * 2

    user.coins += reward
    user.wins += 1

    saveUsers()

    const embed = new EmbedBuilder()
      .setTitle("🎰 Slot Machine")
      .setDescription(
`${result}

🎉 **YOU WON**

Bet: **${bet}**
Reward: **${reward}**

Balance: **${user.coins}**`
      )
      .setColor("Green")

    message.reply({ embeds: [embed] })

  } else {

    user.coins -= bet
    user.losses += 1

    saveUsers()

    const embed = new EmbedBuilder()
      .setTitle("🎰 Slot Machine")
      .setDescription(
`${result}

💀 **YOU LOST**

Lost: **${bet}**

Balance: **${user.coins}**`
      )
      .setColor("Red")

    message.reply({ embeds: [embed] })

  }

        }
// ==============================
// PART 5
// PROFILE UI + ADVANCED LEADERBOARD
// ==============================

// ==============================
// PROFILE COMMAND
// ==============================

if (cmd === "profile" || cmd === "p") {

  const member = message.mentions.users.first() || message.author

  createUser(member.id)

  const data = users[member.id]

  const embed = new EmbedBuilder()
    .setTitle(`👤 ${member.username} Profile`)
    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
    .setDescription(
`🪙 **Coins:** ${data.coins}
💎 **Gems:** ${data.gems}
🏦 **Bank:** ${data.bank}

🌟 **Level:** ${data.level}
⭐ **XP:** ${data.xp}

🏆 **Wins:** ${data.wins}
💀 **Losses:** ${data.losses}`
    )
    .setColor("Aqua")

  message.reply({ embeds: [embed] })

}

// ==============================
// ADVANCED COINS LEADERBOARD
// ==============================

if (cmd === "clb" || cmd === "coinslb") {

  let sorted = Object.entries(users)
    .sort((a, b) => (b[1].coins + b[1].bank) - (a[1].coins + a[1].bank))
    .slice(0, 10)

  let board = ""

  for (let i = 0; i < sorted.length; i++) {

    const id = sorted[i][0]
    const data = sorted[i][1]

    const user = await client.users.fetch(id).catch(() => null)

    if (!user) continue

    let medal = "🔹"

    if (i === 0) medal = "🥇"
    if (i === 1) medal = "🥈"
    if (i === 2) medal = "🥉"

    board += `${medal} **${user.username}** — 🪙 ${data.coins + data.bank}\n`

  }

  const embed = new EmbedBuilder()
    .setTitle("🏆 Top Rich Players")
    .setDescription(board || "No Data")
    .setColor("Gold")

  message.reply({ embeds: [embed] })

}

// ==============================
// GEMS LEADERBOARD ADVANCED
// ==============================

if (cmd === "gemslb") {

  let sorted = Object.entries(users)
    .sort((a, b) => b[1].gems - a[1].gems)
    .slice(0, 10)

  let board = ""

  for (let i = 0; i < sorted.length; i++) {

    const id = sorted[i][0]
    const data = sorted[i][1]

    const user = await client.users.fetch(id).catch(() => null)

    if (!user) continue

    let medal = "🔹"

    if (i === 0) medal = "🥇"
    if (i === 1) medal = "🥈"
    if (i === 2) medal = "🥉"

    board += `${medal} **${user.username}** — 💎 ${data.gems}\n`

  }

  const embed = new EmbedBuilder()
    .setTitle("💎 Top Gems Players")
    .setDescription(board || "No Data")
    .setColor("Purple")

  message.reply({ embeds: [embed] })

  }
// ==============================
// PART 6
// BATTLE SYSTEM (LIVE HP UI)
// ==============================

// ACTIVE BATTLES
const battles = {}

// ==============================
// BATTLE COMMAND
// ==============================

if (cmd === "battle") {

  const opponent = message.mentions.users.first()

  if (!opponent) return message.reply("❌ Mention a user to battle")

  if (opponent.bot) return message.reply("❌ You cannot battle bots")

  if (opponent.id === message.author.id) return message.reply("❌ You cannot battle yourself")

  const challenger = message.author

  const battleId = challenger.id + opponent.id

  battles[battleId] = {
    challenger: challenger.id,
    acceptor: opponent.id,
    hp1: 100,
    hp2: 100
  }

  const embed = new EmbedBuilder()
    .setTitle("⚔️ Battle Request")
    .setDescription(
`🔥 **${challenger.username}** challenged **${opponent.username}**

Type **s accept** to start the battle`
    )
    .setColor("Orange")

  message.reply({ embeds: [embed] })

}

// ==============================
// ACCEPT BATTLE
// ==============================

if (cmd === "accept") {

  const battle = Object.values(battles).find(b => b.acceptor === message.author.id)

  if (!battle) return message.reply("❌ No battle request found")

  const p1 = await client.users.fetch(battle.challenger)
  const p2 = await client.users.fetch(battle.acceptor)

  let hp1 = 100
  let hp2 = 100

  const msg = await message.reply("⚔️ Battle Starting...")

  const interval = setInterval(async () => {

    const dmg1 = Math.floor(Math.random() * 20) + 5
    const dmg2 = Math.floor(Math.random() * 20) + 5

    hp1 -= dmg2
    hp2 -= dmg1

    if (hp1 < 0) hp1 = 0
    if (hp2 < 0) hp2 = 0

    const bar1 = hpBar(hp1, 100)
    const bar2 = hpBar(hp2, 100)

    const ui =
`┌─── ACCEPTOR ───┐ ┌─── CHALLENGER ───┐
│🐉: PLAYER              │ │🐉: PLAYER                 │
│📛: ${p2.username}         │ │📛: ${p1.username}            │
│🌟 LVL: ?                 │ │🌟 LVL: ?                    │
│❤️ HP ${bar2}│ │❤️ HP ${bar1} │
│🖼️ Avatar: LINK      │ │🖼️ Avatar: LINK         │
└───────────────┘ └──────────────────┘`

    await msg.edit(`⚔️ **BATTLE** ⚔️\n\n${ui}`)

    if (hp1 <= 0 || hp2 <= 0) {

      clearInterval(interval)

      let winner
      let loser

      if (hp1 <= 0) {
        winner = p2
        loser = p1
      } else {
        winner = p1
        loser = p2
      }

      createUser(winner.id)
      createUser(loser.id)

      users[winner.id].wins += 1
      users[loser.id].losses += 1

      saveUsers()

      await msg.edit(
`🏆 **WINNER: ${winner.username}**

💀 **LOSER: ${loser.username}**`
      )

    }

  }, 3000)

                                             }
// ==============================
// PART 7
// SHOP + INVENTORY SYSTEM
// ==============================

// SHOP ITEMS
const shop = {
  sword: {
    name: "⚔️ Sword",
    price: 500,
    power: 10
  },
  shield: {
    name: "🛡️ Shield",
    price: 400,
    power: 8
  },
  potion: {
    name: "🧪 Potion",
    price: 200,
    power: 0
  }
}

// ==============================
// SHOP COMMAND
// ==============================

if (cmd === "shop") {

  let text = ""

  for (const key in shop) {

    const item = shop[key]

    text += `**${item.name}**
Price: 🪙 ${item.price}
ID: \`${key}\`

`

  }

  const embed = new EmbedBuilder()
    .setTitle("🛒 Item Shop")
    .setDescription(text)
    .setColor("Orange")

  message.reply({ embeds: [embed] })

}

// ==============================
// BUY COMMAND
// ==============================

if (cmd === "buy") {

  const itemID = args[0]

  if (!itemID) return message.reply("❌ Enter item ID")

  const item = shop[itemID]

  if (!item) return message.reply("❌ Item not found")

  createUser(message.author.id)

  const user = users[message.author.id]

  if (user.coins < item.price) {
    return message.reply("❌ Not enough coins")
  }

  user.coins -= item.price

  user.inventory.push(itemID)

  saveUsers()

  message.reply(`✅ You bought **${item.name}** for **${item.price} coins**`)

}

// ==============================
// INVENTORY COMMAND
// ==============================

if (cmd === "inv" || cmd === "inventory") {

  createUser(message.author.id)

  const user = users[message.author.id]

  if (user.inventory.length === 0) {
    return message.reply("🎒 Your inventory is empty")
  }

  let items = ""

  user.inventory.forEach(i => {

    const item = shop[i]

    if (item) items += `${item.name}\n`

  })

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${message.author.username}'s Inventory`)
    .setDescription(items)
    .setColor("Blue")

  message.reply({ embeds: [embed] })

}

// ==============================
// CLOSE COMMAND HANDLER
// ==============================

})


// ==============================
// LOGIN BOT
// ==============================

client.login(process.env.TOKEN)
