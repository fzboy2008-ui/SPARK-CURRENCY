// ===================== BOT SETUP =====================
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const prefix = "s ";
let users = {};

// Load database
if (fs.existsSync("./users.json")) {
    users = JSON.parse(fs.readFileSync("./users.json", "utf8"));
}

function save() {
    fs.writeFileSync("./users.json", JSON.stringify(users, null, 2));
}

// Get or create user
function getUser(id) {
    if (!users[id]) {
        users[id] = {
            wallet: 0,
            bank: 0,
            gems: 0,
            dragon: null,
            dragonLevel: 0,
            xp: 0,
            rank: 0,
            wins: 0,
            loses: 0,
            admins: []
        };
    }
    return users[id];
}

// Bot Owner ID
const botOwnerId = "fzboy786_01978";

// ------------------ READY EVENT ------------------
client.once("ready", () => {
    console.log(`${client.user.tag} is online!`);
});

// ------------------ MESSAGE HANDLER ------------------
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const user = getUser(msg.author.id);
// ------------------ COINFLIP ------------------
if (cmd === "cf" || cmd === "coinflip") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);
    if (!bet || bet <= 0) return msg.reply("Enter a valid bet.");
    if (bet > 200000) bet = 200000;
    if (bet > user.wallet) return msg.reply("Not enough coins.");

    let spinMsg = await msg.reply("🪙 Flipping the coin...");

    setTimeout(() => {
        let win = Math.random() < 0.5; // 50% chance
        if (win) {
            user.wallet += bet;
            spinMsg.edit(`
🪙 **COINFLIP RESULT**
✨ YOU WON
Bet: ${bet}
New Wallet Balance: ${user.wallet}
            `);
        } else {
            user.wallet -= bet;
            spinMsg.edit(`
🪙 **COINFLIP RESULT**
💀 YOU LOST
Lost: ${bet}
New Wallet Balance: ${user.wallet}
            `);
        }
        save();
    }, 2000);
}

// ------------------ SLOT MACHINE ------------------
if (cmd === "slot") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);
    if (!bet || bet <= 0) return msg.reply("Enter a valid bet.");
    if (bet > 200000) bet = 200000;
    if (bet > user.wallet) return msg.reply("Not enough coins.");

    const symbols = ["💎", "🥭", "🍉"];
    let spinMsg = await msg.reply("🎰 Spinning the slot...");

    // Animated spin
    let spinCount = 0;
    const interval = setInterval(() => {
        let s1 = symbols[Math.floor(Math.random() * symbols.length)];
        let s2 = symbols[Math.floor(Math.random() * symbols.length)];
        let s3 = symbols[Math.floor(Math.random() * symbols.length)];
        spinMsg.edit(`🎰 Spinning...\n| ${s1} | ${s2} | ${s3} |`);
        spinCount++;
        if (spinCount > 4) clearInterval(interval);
    }, 700);

    setTimeout(() => {
        let s1 = symbols[Math.floor(Math.random() * symbols.length)];
        let s2 = symbols[Math.floor(Math.random() * symbols.length)];
        let s3 = symbols[Math.floor(Math.random() * symbols.length)];

        let resultText = "";
        if (s1 === s2 && s2 === s3) {
            let reward = bet * 2;
            user.wallet += reward;
            resultText = `
🎰 **SLOT RESULT**
| ${s1} | ${s2} | ${s3} |
🎉 JACKPOT! You won ${reward} coins
            `;
        } else {
            user.wallet -= bet;
            resultText = `
🎰 **SLOT RESULT**
| ${s1} | ${s2} | ${s3} |
💀 You lost ${bet} coins
            `;
        }
        spinMsg.edit(resultText);
        save();
    }, 4200);
}

// ------------------ DAILY REWARD ------------------
if (cmd === "daily") {
    const lastDaily = user.lastDaily || 0;
    const now = Date.now();
    if (now - lastDaily < 24*60*60*1000) {
        let next = new Date(lastDaily + 24*60*60*1000);
        return msg.reply(`⏳ Daily already claimed! Next in ${Math.ceil((next - now)/3600000)} hours`);
    }
    let coins = 500 + Math.floor(Math.random() * 500);
    let gems = 2;
    user.wallet += coins;
    user.gems += gems;
    user.lastDaily = now;
    msg.reply(`💰 You received **${coins} coins** and **${gems} gems** as daily reward!`);
    save();
}

// ------------------ PROFILE ------------------
if (cmd === "profile") {
    let p = user;
    msg.reply(`
👤 **${msg.author.username}'s PROFILE**
Wallet: ${p.wallet} | Bank: ${p.bank} | Gems: ${p.gems}
XP: ${p.xp} | Rank: ${p.rank}
Dragon: ${p.dragon ? p.dragon.toUpperCase() + " Lv" + p.dragonLevel : "None"}
    `);
}

// ------------------ BATTLE ------------------
if (cmd === "challenge") {
    let opponent = msg.mentions.users.first();
    if (!opponent) return msg.reply("Mention a user to challenge.");

    msg.channel.send(`
⚔ **BATTLE CHALLENGE**
${msg.author.username} challenged ${opponent.username}
Type: s accept
    `);
}

if (cmd === "accept") {
    msg.channel.send("⚔ Battle starting...");

    setTimeout(() => {
        let members = [msg.author.id];
        if (msg.mentions.users.first()) members.push(msg.mentions.users.first().id);
        let winnerId = members[Math.floor(Math.random() * members.length)];

        let winnerUser = getUser(winnerId);
        winnerUser.gems += 5;
        winnerUser.wins += 1;

        members.forEach((id) => {
            if (id !== winnerId) {
                let loser = getUser(id);
                loser.loses += 1;
            }
        });

        save();

        msg.channel.send(`
🏆 **BATTLE RESULT**
Winner: <@${winnerId}>
Reward: 5 gems
        `);
    }, 5000);
}

// ------------------ LEADERBOARDS ------------------
if (cmd === "lb" && args[0] === "c") {
    let sorted = Object.entries(users)
        .sort((a,b)=> (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank))
        .slice(0,10);

    let text = "🏆 **COINS & GEMS LEADERBOARD**\n\n";
    sorted.forEach(([id,data],i) => {
        text += `${i+1}. <@${id}> — Wallet: ${data.wallet}, Bank: ${data.bank}, Gems: ${data.gems}\n`;
    });
    msg.channel.send(text);
}

if (cmd === "lb" && args[0] === "b") {
    let sorted = Object.entries(users)
        .sort((a,b)=> b[1].wins - a[1].wins)
        .slice(0,10);

    let text = "⚔ **BATTLE LEADERBOARD**\n\n";
    sorted.forEach(([id,data],i) => {
        text += `${i+1}. <@${id}> — Wins: ${data.wins}, Loses: ${data.loses}\n`;
    });
    msg.channel.send(text);
                                    }
// ------------------ DRAGON SHOP ------------------
const dragons = {
    fire: { name: "FIRE_DRAGON", price: 5000000 },
    ice: { name: "ICE_DRAGON", price: 6000000 },
    wind: { name: "WIND_DRAGON", price: 7000000 },
    lightning: { name: "LIGHTNING_DRAGON", price: 8500000 },
    earth: { name: "EARTH_DRAGON", price: 10000000 },
};

// Buy dragon
if (cmd === "buy") {
    let key = args[0]?.toLowerCase();
    if (!key || !dragons[key]) return msg.reply("Usage: s buy <dragon_name>");
    if (user.dragon) return msg.reply("You already own a dragon. Feed or upgrade it.");
    if (user.wallet < dragons[key].price) return msg.reply("Not enough coins to buy this dragon.");
    user.wallet -= dragons[key].price;
    user.dragon = dragons[key].name;
    user.dragonLevel = 1;
    msg.reply(`🐉 You bought **${user.dragon}**! Use s set ${user.dragon.toLowerCase()} to select it.`);
    save();
}

// Set dragon
if (cmd === "set") {
    if (!user.dragon) return msg.reply("You don't own any dragon.");
    let sel = args[0]?.toLowerCase();
    if (!sel || sel !== user.dragon.toLowerCase()) return msg.reply("You can only select your owned dragon.");
    user.selectedDragon = user.dragon;
    msg.reply(`✅ ${user.selectedDragon} is now selected.`);
    save();
}

// Feed dragon
if (cmd === "feed") {
    if (!user.selectedDragon) return msg.reply("No dragon selected. Use s set <dragon_name>");
    if (user.gems < 100) return msg.reply("You need 100 gems to feed your dragon.");
    user.gems -= 100;
    user.dragonLevel += 1;
    msg.reply(`🐉 ${user.selectedDragon} has leveled up! Level: ${user.dragonLevel}`);
    save();
}

// ------------------ XP & RANK SYSTEM ------------------
if (!user.xp) user.xp = 0;
if (!user.rank) user.rank = 0;

// Each chat = 1 XP
user.xp += 1;

// Check rank up
let nextRankXP = 2500 * (user.rank + 1);
if (user.xp >= nextRankXP) {
    user.rank += 1;
    user.wallet += 5000;
    user.gems += 5;
    msg.channel.send(`🎉 Congrats <@${msg.author.id}>! You reached **Rank ${user.rank}** and received 5000 coins + 5 gems!`);
}

// ------------------ SERVER ADMIN CMDS ------------------
if ((cmd === "disable" || cmd === "enable") && msg.member.permissions.has("ADMINISTRATOR")) {
    const channel = msg.mentions.channels.first();
    if (!channel) return msg.reply("Mention a channel.");
    msg.reply(`✅ Bot ${cmd}d in ${channel.name}`);
}

// ------------------ BOT OWNER CMDS ------------------
const botOwnerId = "fzboy786_01978";

if (msg.author.id === botOwnerId) {
    if (cmd === "setmoney") {
        let target = msg.mentions.users.first();
        let amount = parseInt(args[1]);
        if (!target || !amount) return msg.reply("Usage: s setmoney @user amount");
        const targetUser = getUser(target.id);
        targetUser.wallet = amount;
        save();
        msg.reply(`💰 Set ${target.username}'s wallet to ${amount}`);
    }

    if (cmd === "setgems") {
        let target = msg.mentions.users.first();
        let amount = parseInt(args[1]);
        if (!target || !amount) return msg.reply("Usage: s setgems @user amount");
        const targetUser = getUser(target.id);
        targetUser.gems = amount;
        save();
        msg.reply(`💎 Set ${target.username}'s gems to ${amount}`);
    }

    if (cmd === "reset") {
        users = {};
        save();
        msg.reply("⚠ Bot data reset successfully.");
    }

    // Admin access management
    if (cmd === "admin" && args[0]) {
        const subcmd = args[0].toLowerCase();
        if (subcmd === "add") {
            let target = msg.mentions.users.first();
            if (!target) return msg.reply("Mention user to add admin.");
            if (!user.admins) user.admins = [];
            if (!user.admins.includes(target.id)) user.admins.push(target.id);
            save();
            msg.reply(`✅ Added <@${target.id}> as bot admin.`);
        }
        if (subcmd === "remove") {
            let target = msg.mentions.users.first();
            if (!target) return msg.reply("Mention user to remove admin.");
            if (!user.admins) user.admins = [];
            user.admins = user.admins.filter((id) => id !== target.id);
            save();
            msg.reply(`❌ Removed <@${target.id}> from bot admins.`);
        }
        if (subcmd === "list") {
            msg.reply(`👑 Bot Admins:\n${user.admins ? user.admins.map(id => `<@${id}>`).join("\n") : "No admins set"}`);
        }
    }
}
// ------------------ SAVE DATABASE ------------------
process.on("exit", () => {
    save();
});

// Also save on SIGINT (Ctrl+C)
process.on("SIGINT", () => {
    save();
    process.exit();
});

// ------------------ BOT LOGIN ------------------
client.login(process.env.TOKEN);
