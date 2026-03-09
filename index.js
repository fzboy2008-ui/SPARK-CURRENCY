// ====================================================== // SPARK RPG DISCORD BOT (PRO VERSION) // Economy + RPG + Real Battle + Casino Animation + Help UI // ======================================================

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js'); const fs = require('fs'); require('dotenv').config();

// ================= CLIENT ================= const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers ] });

// ================= CONFIG ================= const PREFIXES = ["s ", "spark "]; const OWNER_ID = "PUT_OWNER_ID_HERE";

// ================= DATABASE ================= if (!fs.existsSync('./database')) fs.mkdirSync('./database'); if (!fs.existsSync('./database/users.json')) fs.writeFileSync('./database/users.json', '{}');

let users = JSON.parse(fs.readFileSync('./database/users.json'));

function save() { fs.writeFileSync('./database/users.json', JSON.stringify(users, null, 2)); }

function getUser(id) {

if (!users[id]) {

users[id] = {

  wallet: 500,
  bank: 0,
  gems: 10,

  xp: 0,
  rank: 1,

  dragon: null,
  weapon: null,
  armour: null,

  dragonLevel: 1,

  wins: 0,
  loses: 0,

  lastDaily: 0,

  inventory: {
    dragons: [],
    weapons: [],
    armours: []
  }

};

}

return users[id]; }

// ================= RPG ITEMS =================

const dragons = {

grog: { name: "Stone Grog", power: 40, price: 2000 },

blaze: { name: "Blaze Dragon", power: 60, price: 5000 },

frost: { name: "Frost Dragon", power: 75, price: 8000 },

shadow: { name: "Shadow Dragon", power: 90, price: 12000 },

rex: { name: "Thunder Rex", power: 110, price: 16000 }

};

const weapons = {

sword: { name: "Flame Sword", power: 20, price: 1500 },

axe: { name: "Titan Axe", power: 30, price: 3000 },

blade: { name: "Shadow Blade", power: 40, price: 5000 },

hammer: { name: "War Hammer", power: 55, price: 7000 },

godblade: { name: "God Blade", power: 70, price: 10000 }

};

const armours = {

shield: { name: "Dragon Shield", power: 15, price: 2000 },

knight: { name: "Knight Armour", power: 25, price: 4000 },

frostplate: { name: "Frost Plate", power: 35, price: 6000 },

shadowguard: { name: "Shadow Guard", power: 50, price: 9000 },

godarmor: { name: "God Armor", power: 70, price: 13000 }

};

// ================= READY ================= client.once('ready', () => {

console.log("Spark RPG Bot Online: " + client.user.tag);

});

// ================= PREFIX ================= function getPrefix(msg) {

return PREFIXES.find(p => msg.content.toLowerCase().startsWith(p));

}

// ================= DRAGON LEVEL SYSTEM ================= function dragonPower(user) {

const base = dragons[user.dragon]?.power || 10;

return base + (user.dragonLevel * 5);

}

function levelDragon(user) {

user.dragonLevel++;

}

// ================= MESSAGE ================= client.on('messageCreate', async message => {

if (message.author.bot) return;

const prefix = getPrefix(message);

if (!prefix) return;

const args = message.content.slice(prefix.length).trim().split(/ +/);

const cmd = args.shift().toLowerCase();

const user = getUser(message.author.id);

// ================= HELP =================

if (cmd === "help") {

const embed = new EmbedBuilder()

  .setTitle("Spark RPG Commands")

  .setColor("Blue")

  .setDescription(

    "Economy\n" +

    "s bal\n" +

    "s daily\n\n" +

    "RPG\n" +

    "s shop\n" +

    "s buy <item>\n" +

    "s inv\n" +

    "s equip <item>\n\n" +

    "Battle\n" +

    "s battle @user\n\n" +

    "Casino\n" +

    "s roll <bet>"

  );

return message.reply({ embeds: [embed] });

}

// ================= BALANCE =================

if (cmd === "bal" || cmd === "balance") {

const embed = new EmbedBuilder()

  .setTitle("Balance")

  .setColor("Gold")

  .setDescription(`Wallet: ${user.wallet}\nBank: ${user.bank}\nGems: ${user.gems}`);

return message.reply({ embeds: [embed] });

}

// ================= DAILY =================

if (cmd === "daily") {

const now = Date.now();

const cooldown = 86400000;

if (now - user.lastDaily < cooldown) {

  const remaining = cooldown - (now - user.lastDaily);

  const h = Math.floor(remaining / 3600000);

  const m = Math.floor((remaining % 3600000) / 60000);

  return message.reply(`Come back in ${h}h ${m}m`);

}

user.wallet += 500;

user.lastDaily = now;

save();

return message.reply("Daily reward claimed: 500 coins");

}

// ================= SHOP =================

if (cmd === "shop") {

const embed = new EmbedBuilder()

  .setTitle("RPG Shop")

  .setColor("Green")

  .setDescription(

    "Dragons\n" +

    "grog 2000\n" +

    "blaze 5000\n" +

    "frost 8000\n" +

    "shadow 12000\n" +

    "rex 16000\n\n" +

    "Weapons\n" +

    "sword 1500\n" +

    "axe 3000\n" +

    "blade 5000\n" +

    "hammer 7000\n" +

    "godblade 10000\n\n" +

    "Armours\n" +

    "shield 2000\n" +

    "knight 4000\n" +

    "frostplate 6000\n" +

    "shadowguard 9000\n" +

    "godarmor 13000"

  );

return message.reply({ embeds: [embed] });

}

// ================= BUY =================

if (cmd === "buy") {

const item = args[0];

if (dragons[item]) {

  const d = dragons[item];

  if (user.wallet < d.price) return message.reply("Not enough coins");

  user.wallet -= d.price;

  user.inventory.dragons.push(item);

  save();

  return message.reply(`Bought ${d.name}`);

}

if (weapons[item]) {

  const w = weapons[item];

  if (user.wallet < w.price) return message.reply("Not enough coins");

  user.wallet -= w.price;

  user.inventory.weapons.push(item);

  save();

  return message.reply(`Bought ${w.name}`);

}

if (armours[item]) {

  const a = armours[item];

  if (user.wallet < a.price) return message.reply("Not enough coins");

  user.wallet -= a.price;

  user.inventory.armours.push(item);

  save();

  return message.reply(`Bought ${a.name}`);

}

}

// ================= INVENTORY =================

if (cmd === "inv" || cmd === "inventory") {

const embed = new EmbedBuilder()

  .setTitle("Inventory")

  .setColor("Purple")

  .addFields(

    { name: "Dragons", value: user.inventory.dragons.join(", ") || "None" },

    { name: "Weapons", value: user.inventory.weapons.join(", ") || "None" },

    { name: "Armours", value: user.inventory.armours.join(", ") || "None" }

  );

return message.reply({ embeds: [embed] });

}

// ================= EQUIP =================

if (cmd === "equip") {

const item = args[0];

if (user.inventory.dragons.includes(item)) {

  user.dragon = item;

  save();

  return message.reply(`Equipped dragon ${item}`);

}

if (user.inventory.weapons.includes(item)) {

  user.weapon = item;

  save();

  return message.reply(`Equipped weapon ${item}`);

}

if (user.inventory.armours.includes(item)) {

  user.armour = item;

  save();

  return message.reply(`Equipped armour ${item}`);

}

}

// ================= REAL BATTLE =================

if (cmd === "battle") {

const target = message.mentions.users.first();

if (!target) return message.reply("Mention opponent");

const enemy = getUser(target.id);

let p1 = dragonPower(user) + (weapons[user.weapon]?.power || 0);

let p2 = dragonPower(enemy) + (weapons[enemy.weapon]?.power || 0);

let hp1 = 100;

let hp2 = 100;

while (hp1 > 0 && hp2 > 0) {

  hp2 -= Math.floor(Math.random() * p1);

  if (hp2 <= 0) break;

  hp1 -= Math.floor(Math.random() * p2);

}

let winner;

if (hp1 > hp2) {

  winner = message.author;

  user.wins++;

  user.wallet += 500;

  levelDragon(user);

} else {

  winner = target;

  user.loses++;

}

save();

const embed = new EmbedBuilder()

  .setTitle("Battle Result")

  .setDescription(`Winner: ${winner}`)

  .setColor("Red");

return message.reply({ embeds: [embed] });

}

// ================= CASINO ROLL =================

if (cmd === "roll") {

const bet = parseInt(args[0]);

if (!bet) return message.reply("Enter bet amount");

if (user.wallet < bet) return message.reply("Not enough coins");

const msg = await message.reply("Rolling...");

const numbers = [1,2,3,4,5,6];

for (let i = 0; i < 5; i++) {

  const r = numbers[Math.floor(Math.random()*6)];

  await msg.edit(`Rolling ${r}`);

  await new Promise(r => setTimeout(r, 600));

}

const final = numbers[Math.floor(Math.random()*6)];

if (final >= 4) {

  user.wallet += bet;

  await msg.edit(`Result ${final}\nYou won ${bet}`);

} else {

  user.wallet -= bet;

  await msg.edit(`Result ${final}\nYou lost ${bet}`);

}

save();

}

});

// ================= LOGIN =================

client.login(process.env.TOKEN);
