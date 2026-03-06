// ======================= IMPORTS =======================
const { Client, Intents } = require("discord.js");
const fs = require("fs");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const prefix = "s ";

// ======================= DATABASE =======================
let users = {};
const dbFile = "./users.json";

function save() {
    fs.writeFileSync(dbFile, JSON.stringify(users, null, 2));
}

function load() {
    if (fs.existsSync(dbFile)) users = JSON.parse(fs.readFileSync(dbFile));
}

function getUser(id) {
    if (!users[id]) users[id] = {
        wallet: 0,
        bank: 0,
        gems: 0,
        dragon: null,
        dragonLevel: 0,
        xp: 0,
        rank: 0,
        wins: 0,
        loses: 0,
        daily: 0,
        admins: []
    };
    return users[id];
}

load();

// ======================= DRAGON DATA =======================
const DRAGONS = [
    { name: "FIRE_FLAME", price: 1000000 },
    { name: "ICE_FANG", price: 2000000 },
    { name: "WIND_WING", price: 3000000 },
    { name: "LIGHTNING_SPARK", price: 4000000 },
    { name: "EARTH_ROCK", price: 5000000 }
];

// ======================= BOT OWNER =======================
const BOT_OWNER = "fzboy786_01978";

// ======================= MESSAGE HANDLER =======================
client.on("messageCreate", async (msg) => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const user = getUser(msg.author.id);

    // ----------- COINFLIP -----------
    if (cmd === "cf" || cmd === "coinflip") {
        let bet = args[0];
        if (bet === "all") bet = user.wallet;
        bet = parseInt(bet);
        if (!bet || bet <= 0) return msg.reply("Enter a valid bet.");
        if (bet > 200000) bet = 200000;
        if (bet > user.wallet) return msg.reply("Not enough coins.");

        let spinMsg = await msg.reply("🪙 Flipping coin...");
        setTimeout(() => {
            let win = Math.random() < 0.5;
            if (win) {
                user.wallet += bet;
                spinMsg.edit(`
🪙 **COINFLIP RESULT**
✨ YOU WON
Bet: ${bet}
New Wallet: ${user.wallet}
                `);
            } else {
                user.wallet -= bet;
                spinMsg.edit(`
🪙 **COINFLIP RESULT**
💀 YOU LOST
Lost: ${bet}
New Wallet: ${user.wallet}
                `);
            }
            save();
        }, 2000);
    }

    // ----------- SLOT MACHINE -----------
    if (cmd === "slot") {
        let bet = args[0];
        if (bet === "all") bet = user.wallet;
        bet = parseInt(bet);
        if (!bet || bet <= 0) return msg.reply("Enter a valid bet.");
        if (bet > 200000) bet = 200000;
        if (bet > user.wallet) return msg.reply("Not enough coins.");

        const symbols = ["💎", "🥭", "🍉"];
        let spinMsg = await msg.reply("🎰 Spinning the slot...");

        let spinCount = 0;
        const interval = setInterval(() => {
            let s1 = symbols[Math.floor(Math.random() * 3)];
            let s2 = symbols[Math.floor(Math.random() * 3)];
            let s3 = symbols[Math.floor(Math.random() * 3)];
            spinMsg.edit(`🎰 Spinning...\n| ${s1} | ${s2} | ${s3} |`);
            spinCount++;
            if (spinCount > 4) clearInterval(interval);
        }, 700);

        setTimeout(() => {
            let s1 = symbols[Math.floor(Math.random() * 3)];
            let s2 = symbols[Math.floor(Math.random() * 3)];
            let s3 = symbols[Math.floor(Math.random() * 3)];

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

    // ----------- DAILY -----------
    if (cmd === "daily") {
        const now = Date.now();
        if (user.daily && now - user.daily < 24 * 60 * 60 * 1000)
            return msg.reply("⏳ You already claimed daily reward.");
        user.daily = now;
        user.wallet += 5000;
        user.gems += 5;
        save();
        msg.reply(`
🎁 **DAILY REWARD**
Coins: 5000
Gems: 5
        `);
    }

    // ----------- DRAGON SHOP -----------
    if (cmd === "buy") {
        let dragonName = args.join("_").toUpperCase();
        const dragon = DRAGONS.find(d => d.name === dragonName);
        if (!dragon) return msg.reply("Dragon not found.");
        if (user.dragon) return msg.reply("You already have a dragon.");
        if (user.wallet < dragon.price) return msg.reply("Not enough coins.");
        user.wallet -= dragon.price;
        user.dragon = dragon.name;
        user.dragonLevel = 1;
        save();
        msg.reply(`🐉 You bought ${dragon.name}!`);
    }

    if (cmd === "set") {
        let dragonName = args.join("_").toUpperCase();
        if (user.dragon !== dragonName) return msg.reply("You don't own this dragon.");
        user.dragon = dragonName;
        save();
        msg.reply(`🐉 Dragon selected: ${dragonName}`);
    }

    // ----------- FEED DRAGON -----------
    if (cmd === "feed") {
        if (!user.dragon) return msg.reply("No dragon selected. Use s set <dragon_name>");
        if (user.gems < 100) return msg.reply("You need 100 gems to feed your dragon.");
        user.gems -= 100;
        user.dragonLevel += 1;
        save();
        msg.reply(`🐉 ${user.dragon} leveled up to level ${user.dragonLevel}`);
    }

    // ----------- BATTLE -----------
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

    // ----------- LEADERBOARDS -----------
    if (cmd === "lb" && args[0] === "c") {
        let sorted = Object.entries(users)
            .sort((a, b) => (b[1].wallet + b[1].bank) - (a[1].wallet + a[1].bank))
            .slice(0, 10);
        let text = "🏆 **COINS & GEMS LEADERBOARD**\n\n";
        for (let i = 0; i < sorted.length; i++) {
            let id = sorted[i][0];
            let data = sorted[i][1];
            text += `${i + 1}. <@${id}> — Wallet: ${data.wallet}, Bank: ${data.bank}, Gems: ${data.gems}\n`;
        }
        msg.channel.send(text);
    }

    if (cmd === "lb" && args[0] === "b") {
        let sorted = Object.entries(users)
            .sort((a, b) => b[1].wins - a[1].wins)
            .slice(0, 10);
        let text = "⚔ **BATTLE LEADERBOARD**\n\n";
        for (let i = 0; i < sorted.length; i++) {
            let id = sorted[i][0];
            let data = sorted[i][1];
            text += `${i + 1}. <@${id}> — Wins: ${data.wins}, Loses: ${data.loses}\n`;
        }
        msg.channel.send(text);
    }

    // ----------- SERVER ADMIN -----------
    if ((cmd === "disable" || cmd === "enable") && msg.member.permissions.has("ADMINISTRATOR")) {
        const channel = msg.mentions.channels.first();
        if (!channel) return msg.reply("Mention a channel.");
        msg.reply(`✅ Bot ${cmd}d in ${channel.name}`);
    }

    // ----------- BOT OWNER -----------
    if (msg.author.id === BOT_OWNER) {
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

        // Admin access
        if (cmd === "admin" && args[0]) {
            const sub = args[0].toLowerCase();
            if (sub === "add") {
                let target = msg.mentions.users.first();
                if (!target) return msg.reply("Mention user to add admin.");
                if (!user.admins) user.admins = [];
                if (!user.admins.includes(target.id)) user.admins.push(target.id);
                save();
                msg.reply(`✅ Added <@${target.id}> as bot admin.`);
            }
            if (sub === "remove") {
                let target = msg.mentions.users.first();
                if (!target) return msg.reply("Mention user to remove admin.");
                if (!user.admins) user.admins = [];
                user.admins = user.admins.filter(id => id !== target.id);
                save();
                msg.reply(`❌ Removed <@${target.id}> from bot admins.`);
            }
            if (sub === "list") {
                msg.reply(`👑 Bot Admins:\n${user.admins ? user.admins.map(id => `<@${id}>`).join("\n") : "No admins set"}`);
            }
        }
    }

    // ----------- XP SYSTEM -----------
    user.xp += 1;
    if (user.xp >= 2500) {
        user.rank += 1;
        user.wallet += 5000;
        user.gems += 5;
        user.xp = 0;
        msg.reply(`🎉 Congrats! You reached rank ${user.rank}. Reward: 5000 coins & 5 gems`);
        save();
    }
});

// ======================= EXIT SAVE =======================
process.on("exit", () => {
    save();
});

// ======================= LOGIN =======================
client.login(process.env.TOKEN);
