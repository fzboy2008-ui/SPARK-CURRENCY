/* ================= IMPORTS ================= */
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

/* ================= CLIENT SETUP ================= */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

/* ================= PREFIXES & OWNER ================= */
const PREFIXES = ["s ", "S ", "spark ", "Spark "];
const OWNER_ID = "1266728371719508062"; // fzboy786_01978

/* ================= DATABASE ================= */
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json", "{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function saveUsers() {
    fs.writeFileSync("./database/users.json", JSON.stringify(users, null, 2));
}

function getUser(id) {
    if (!users[id]) {
        users[id] = {
            wallet: 0,
            bank: 0,
            gems: 0,
            xp: 0,
            rank: 0,
            dragon: null,
            weapon: null,
            armour: null,
            inventory: {
                dragons: [],
                weapons: [],
                armours: []
            },
            lastDaily: 0,
            wins: 0,
            loses: 0,
            isAdmin: false,
            currentChallenge: null
        };
    }
    return users[id];
}

/* ================= BOT READY ================= */
client.once("ready", () => {
    console.log(`⚡ Spark Bot Online as ${client.user.tag}`);
});
/* ================= MESSAGE HANDLER ================= */
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.startsWith(p));
    if (!prefixUsed) {
        // XP gain for chat
        const user = getUser(message.author.id);
        user.xp += 1;
        if (user.xp >= 5000) { // simple max rank cap example
            user.rank += 1;
            user.xp = 0;
        }
        saveUsers();
        return;
    }

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const user = getUser(message.author.id);

    /* ================= ECONOMY COMMANDS ================= */
    if (command === "bal") {
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username}'s Balance`)
            .setDescription(`💼 Wallet: ${user.wallet}\n🏦 Bank: ${user.bank}\n💎 Gems: ${user.gems}`)
            .setColor("Random");
        message.channel.send({ embeds: [embed] });
    }

    else if (command === "daily") {
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; // 24h
        if (now - user.lastDaily < cooldown) {
            const next = new Date(user.lastDaily + cooldown);
            message.channel.send(`⏳ Daily Already Claimed\nNext claim: <t:${Math.floor(next/1000)}:R>`);
        } else {
            user.wallet += 1000;
            user.lastDaily = now;
            saveUsers();
            message.channel.send(`🎁 Daily Reward Claimed!\n+1000 💼 coins`);
        }
    }

    else if (command === "deposit") {
        const amount = parseInt(args[0]);
        if (!amount || amount <= 0) return message.reply("❌ Enter a valid amount!");
        if (user.wallet < amount) return message.reply("❌ Not enough coins in wallet!");
        user.wallet -= amount;
        user.bank += amount;
        saveUsers();
        message.channel.send(`🏦 Deposit Successful\n${amount} 💼 coins moved to bank`);
    }

    else if (command === "withdraw") {
        const amount = parseInt(args[0]);
        if (!amount || amount <= 0) return message.reply("❌ Enter a valid amount!");
        if (user.bank < amount) return message.reply("❌ Not enough coins in bank!");
        user.bank -= amount;
        user.wallet += amount;
        saveUsers();
        message.channel.send(`💸 Withdraw Successful\n${amount} 💼 coins moved to wallet`);
    }
});
/* ================= GAMBLING COMMANDS ================= */
if (command === "cf") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);
    if (!bet || bet <= 0) return message.reply("❌ Enter a valid bet amount!");
    if (user.wallet < bet) return message.reply("❌ Not enough coins!");

    message.channel.send("🪙 Coinflip\nFlipping...").then(async (msg) => {
        await sleep(500);
        const result = Math.random() < 0.3; // 30% win chance
        if (result) {
            user.wallet += bet;
            msg.edit(`🪙 Coinflip Result: WIN\n+${bet} 💼 coins`);
        } else {
            user.wallet -= bet;
            msg.edit(`🪙 Coinflip Result: LOSE\n-${bet} 💼 coins`);
        }
        saveUsers();
    });
}

else if (command === "slot") {
    let bet = args[0];
    if (bet === "all") bet = user.wallet;
    bet = parseInt(bet);
    if (!bet || bet <= 0) return message.reply("❌ Enter a valid bet amount!");
    if (user.wallet < bet) return message.reply("❌ Not enough coins!");

    const emojis = ["🍒","🍉","🥭","💎"];
    const getSpin = () => [emojis[Math.floor(Math.random()*emojis.length)], emojis[Math.floor(Math.random()*emojis.length)], emojis[Math.floor(Math.random()*emojis.length)]];

    let spinResult = getSpin();
    const spinMessage = await message.channel.send(`🎰 Slot Machine\n${spinResult.join(" | ")}`);

    // Animation sequence
    for (let i = 0; i < 3; i++) {
        await sleep(700 + i*200);
        spinResult = getSpin();
        spinMessage.edit(`🎰 Slot Machine\n${spinResult.join(" | ")}`);
    }

    // Check result
    const counts = {};
    spinResult.forEach(e => counts[e] = (counts[e]||0)+1);
    let reward = 0;
    if (Object.values(counts).includes(3)) reward = bet*3; // triple win
    else if (Object.values(counts).includes(2)) reward = bet*2; // double win
    else reward = -bet;

    if (reward > 0) user.wallet += reward;
    else user.wallet -= bet;
    saveUsers();

    if (reward > 0) spinMessage.edit(`🎰 Slot Machine\n${spinResult.join(" | ")}\n🎉 You Won! +${reward} 💼`);
    else spinMessage.edit(`🎰 Slot Machine\n${spinResult.join(" | ")}\n❌ You Lost! -${bet} 💼`);
}

/* ================= SIMPLE SLEEP FUNCTION ================= */
function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
        }
/* ================= PROFILE COMMAND ================= */
if (command === "profile") {
    const embed = {
        color: 0x00ff00,
        title: `👤 ${message.author.username}`,
        fields: [
            { name: "Rank", value: `${user.rank} ${getRankEmoji(user.rank)}`, inline: true },
            { name: "XP", value: `${user.xp} / ${user.xpToNextRank} (${Math.floor(user.xp/user.xpToNextRank*100)}%)`, inline: true },
            { name: "💼 Wallet", value: `${user.wallet}`, inline: true },
            { name: "🏦 Bank", value: `${user.bank}`, inline: true },
            { name: "💎 Gems", value: `${user.gems}`, inline: true }
        ],
        footer: { text: "Sparkle Empire RPG Bot" }
    };
    message.channel.send({ embeds: [embed] });
}

/* ================= RANK COMMAND ================= */
if (command === "rank") {
    const xpPercent = Math.floor(user.xp/user.xpToNextRank*100);
    const progressBar = "█".repeat(Math.floor(xpPercent/10)) + "░".repeat(10 - Math.floor(xpPercent/10));
    const embed = {
        color: 0x00ff00,
        title: `🏆 Rank Status`,
        description: `
👤 ${message.author.username}
Rank: ${user.rank} ${getRankEmoji(user.rank)}

XP: ${user.xp} / ${user.xpToNextRank}
${progressBar} ${xpPercent}%
        `,
        footer: { text: "Sparkle Empire RPG Bot" }
    };
    message.channel.send({ embeds: [embed] });
}

/* ================= HELPER FUNCTION ================= */
function getRankEmoji(rank) {
    if (rank >= 50) return "👑 Mythic";
    else if (rank >= 30) return "🥇 Gold";
    else if (rank >= 20) return "🥈 Silver";
    else if (rank >= 10) return "🥉 Bronze";
    return "📘 Beginner";
}
/* ================= DEPOSIT COMMAND ================= */
if (command === "deposit") {
    let amount = args[0];
    if (!amount || isNaN(amount)) return message.channel.send("❌ Please provide a valid amount to deposit.");
    amount = Math.floor(Number(amount));

    if (user.wallet < amount) return message.channel.send(`❌ Not enough coins in wallet. Your wallet: ${user.wallet}`);
    user.wallet -= amount;
    user.bank += amount;

    message.channel.send(`🏦 Deposit Successful\n\n${amount} 💼 coins moved to bank\nWallet: ${user.wallet}\nBank: ${user.bank}`);
}

/* ================= WITHDRAW COMMAND ================= */
if (command === "withdraw") {
    let amount = args[0];
    if (!amount || isNaN(amount)) return message.channel.send("❌ Please provide a valid amount to withdraw.");
    amount = Math.floor(Number(amount));

    if (user.bank < amount) return message.channel.send(`❌ Not enough coins in bank. Your bank: ${user.bank}`);
    user.wallet += amount;
    user.bank -= amount;

    message.channel.send(`💸 Withdraw Successful\n\n${amount} 💼 coins moved to wallet\nWallet: ${user.wallet}\nBank: ${user.bank}`);
}
