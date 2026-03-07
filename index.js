/* ================= IMPORTS ================= */
const { 
    Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType 
} = require('discord.js');
const fs = require('fs');
require('dotenv').config();

/* ================= CLIENT SETUP ================= */
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

/* ================= CONFIGURATION ================= */
const PREFIXES = ["s ", "S ", "spark ", "Spark "];
const OWNER_ID = "1266728371719508062"; 
const DB_PATH = "./database/users.json";

/* ================= DATABASE SYSTEM ================= */
// Folder aur File check karna agar nahi hai toh banana
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, "{}");

let users = JSON.parse(fs.readFileSync(DB_PATH));

// Data save karne ka function
function save() {
    fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2));
}

// User data fetch ya create karne ka function
function getUser(id) {
    if (!users[id]) {
        users[id] = {
            wallet: 1000,
            bank: 0,
            gems: 0,
            xp: 0,
            rank: 1,
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
            disabledChannels: [] // Channel lock feature ke liye
        };
        save();
    }
    return users[id];
}

/* ================= UTILS ================= */
// HP Bar banane ka function (Battle system ke liye kaam aayega)
function createHPBar(current, max) {
    const size = 10;
    const filled = Math.max(0, Math.min(size, Math.round((current / max) * size)));
    return "🟩".repeat(filled) + "⬜".repeat(size - filled);
}

/* ================= READY EVENT ================= */
client.once("ready", () => {
    console.log(`
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    ⚡ Spark Pro: ONLINE
    🤖 Bot Tag: ${client.user.tag}
    👑 Owner ID: ${OWNER_ID}
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});
/* ================= XP & RANK SYSTEM ================= */
client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    let user = getUser(message.author.id);

    // 5 XP per message (Cooldown manage ho sakta hai)
    user.xp += 5;
    let neededXP = 2000; // Rank up ke liye required XP

    if (user.xp >= neededXP) {
        user.xp = 0;
        user.rank += 1;
        user.wallet += 5000; // Rank up reward
        
        const rankEmbed = new EmbedBuilder()
            .setTitle("🏆 RANK UP!")
            .setDescription(`Badhai ho ${message.author}! Tu ab **Rank ${user.rank}** par pahunch gaya hai.`)
            .addFields(
                { name: "💰 Bonus", value: "5,000 Coins", inline: true },
                { name: "✨ Next Rank", value: "2,000 XP needed", inline: true }
            )
            .setColor("#00FF00")
            .setTimestamp();

        message.channel.send({ embeds: [rankEmbed] });
    }
    save();
});

/* ================= ECONOMY COMMANDS ================= */
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if (!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* --- BALANCE WITH BUTTONS --- */
    if (cmd === "bal" || cmd === "balance") {
        const balEmbed = new EmbedBuilder()
            .setAuthor({ name: `${message.author.username}'s Account`, iconURL: message.author.displayAvatarURL() })
            .setColor("#FFD700")
            .addFields(
                { name: "👛 Wallet", value: `\`${user.wallet.toLocaleString()}\` 🪙`, inline: true },
                { name: "🏦 Bank", value: `\`${user.bank.toLocaleString()}\` 🏦`, inline: true },
                { name: "💎 Gems", value: `\`${user.gems}\` 💎`, inline: true }
            )
            .setFooter({ text: `Rank: ${user.rank} | XP: ${user.xp}/2000` });

        // Action Row for Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('dep_all').setLabel('Deposit All').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('wit_all').setLabel('Withdraw All').setStyle(ButtonStyle.Primary)
        );

        return message.reply({ embeds: [balEmbed], components: [row] });
    }

    /* --- DAILY REWARD --- */
    if (cmd === "d" || cmd === "daily") {
        const now = Date.now();
        const cooldown = 24 * 60 * 60 * 1000; 

        if (now - user.lastDaily < cooldown) {
            const remaining = cooldown - (now - user.lastDaily);
            const hours = Math.floor(remaining / 3600000);
            const mins = Math.floor((remaining % 3600000) / 60000);
            return message.reply(`⏳ Sabar kar bhai! **${hours}h ${mins}m** baad aana.`);
        }

        user.wallet += 1000;
        user.lastDaily = now;
        save();

        const dailyEmbed = new EmbedBuilder()
            .setTitle("🎁 Daily Reward")
            .setDescription("Tune apne daily **1,000 coins** claim kar liye hain!")
            .setColor("#FF00FF");

        return message.reply({ embeds: [dailyEmbed] });
    }
});

/* ================= INTERACTION HANDLER (Buttons) ================= */
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    let user = getUser(interaction.user.id);

    if (interaction.customId === 'dep_all') {
        if (user.wallet <= 0) return interaction.reply({ content: "Wallet mein paise hi nahi hain!", ephemeral: true });
        user.bank += user.wallet;
        user.wallet = 0;
        save();
        await interaction.reply({ content: "🏦 Saara paisa Bank mein jama kar diya gaya!", ephemeral: true });
    }

    if (interaction.customId === 'wit_all') {
        if (user.bank <= 0) return interaction.reply({ content: "Bank khali hai bhai!", ephemeral: true });
        user.wallet += user.bank;
        user.bank = 0;
        save();
        await interaction.reply({ content: "👛 Saara paisa Bank se nikal liya gaya!", ephemeral: true });
    }
});
/* ================= GAMES LOGIC ================= */
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if (!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    let user = getUser(message.author.id);

    /* --- ANIMATED SLOT MACHINE --- */
    if (cmd === "s" || cmd === "slot") {
        let bet = parseInt(args[0]);
        if (isNaN(bet) || bet <= 0) return message.reply("❌ Bet amount toh daal de bhai!");
        if (bet > user.wallet) return message.reply("❌ Itne paise tere wallet mein nahi hain!");
        if (bet > 50000) bet = 50000; // Max bet limit

        const emojis = ["💎", "🍎", "🍐", "🍋", "🎰", "⭐"];
        const getRandom = () => emojis[Math.floor(Math.random() * emojis.length)];

        // Initial Message
        let msg = await message.reply("🎰 **SPINNING...**\n[ 🔄 | 🔄 | 🔄 ]");

        // Animation Frames (Edit message to show rolling)
        for (let i = 0; i < 3; i++) {
            await new Promise(r => setTimeout(r, 800));
            await msg.edit(`🎰 **SPINNING...**\n[ ${getRandom()} | ${getRandom()} | ${getRandom()} ]`);
        }

        // Final Result
        const res = [getRandom(), getRandom(), getRandom()];
        const isWin = res[0] === res[1] && res[1] === res[2];
        
        if (isWin) {
            let winAmount = bet * 5;
            user.wallet += winAmount;
            await msg.edit(`🎊 **JACKPOT!**\n[ ${res.join(" | ")} ]\n**You won ${winAmount.toLocaleString()} coins!**`);
        } else {
            user.wallet -= bet;
            await msg.edit(`💀 **LOST**\n[ ${res.join(" | ")} ]\n**You lost ${bet.toLocaleString()} coins. Bura hua bhai!**`);
        }
        save();
    }

    /* --- ANIMATED COINFLIP --- */
    if (cmd === "cf" || cmd === "coinflip") {
        let bet = parseInt(args[0]);
        let choice = args[1]?.toLowerCase();
        
        const sides = ["heads", "tails"];
        if (isNaN(bet) || bet <= 0) return message.reply("❌ Kitna lagana hai? (e.g. `s cf 100 heads`) ");
        if (!choice || !sides.includes(choice)) return message.reply("❌ Choice toh bata! `heads` ya `tails`?");
        if (bet > user.wallet) return message.reply("❌ Garib! Wallet check kar pehle.");

        let flipMsg = await message.reply("🪙 **Coin is in the air...**");

        setTimeout(async () => {
            const result = sides[Math.floor(Math.random() * 2)];
            if (result === choice) {
                user.wallet += bet;
                await flipMsg.edit(`✅ **${result.toUpperCase()}!** Tune sahi guess kiya. **+${bet}** coins!`);
            } else {
                user.wallet -= bet;
                await flipMsg.edit(`❌ **${result.toUpperCase()}!** Galat nikla. **-${bet}** coins chale gaye.`);
            }
            save();
        }, 2000);
    }
});
/* ================= SHOP DATA ================= */
const shopItems = {
    dragons: {
        grog: { name: "Grog", emoji: "🪨", price: 50000, power: 50 },
        phoenix: { name: "Phoenix", emoji: "🔥", price: 80000, power: 65 },
        rex: { name: "Rex", emoji: "⚡", price: 120000, power: 75 }
    },
    weapons: {
        "flame sword": { name: "Flame Sword", price: 30000, attack: 15 },
        "thunder blade": { name: "Thunder Blade", price: 45000, attack: 22 }
    }
};

/* ================= SHOP COMMANDS ================= */
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if (!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    let user = getUser(message.author.id);

    /* --- SHOP WITH DROPDOWN --- */
    if (cmd === "shop") {
        const shopEmbed = new EmbedBuilder()
            .setTitle("🛒 Spark Mega Store")
            .setDescription("Neeche diye gaye menu se apna favourite Dragon ya Weapon chuno!")
            .setColor("#00AAFF")
            .setThumbnail("https://i.imgur.com/8fX8W2S.png"); // Koi bhi cool icon link

        const menu = new StringSelectMenuBuilder()
            .setCustomId('buy_item')
            .setPlaceholder('Kya kharidna chahte ho?')
            .addOptions([
                { label: 'Grog (Dragon)', description: 'Price: 50,000 | Power: 50', value: 'dragon_grog', emoji: '🪨' },
                { label: 'Phoenix (Dragon)', description: 'Price: 80,000 | Power: 65', value: 'dragon_phoenix', emoji: '🔥' },
                { label: 'Rex (Dragon)', description: 'Price: 1,20,000 | Power: 75', value: 'dragon_rex', emoji: '⚡' },
                { label: 'Flame Sword (Weapon)', description: 'Price: 30,000 | Attack: 15', value: 'weapon_flame sword', emoji: '🗡️' }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);
        return message.reply({ embeds: [shopEmbed], components: [row] });
    }

    /* --- INVENTORY CHECK --- */
    if (cmd === "inv" || cmd === "inventory") {
        const invEmbed = new EmbedBuilder()
            .setTitle(`🎒 ${message.author.username}'s Inventory`)
            .setColor("#9B59B6")
            .addFields(
                { name: "🐉 Dragons", value: user.inventory.dragons.length > 0 ? user.inventory.dragons.join(", ") : "None", inline: false },
                { name: "⚔️ Weapons", value: user.inventory.weapons.length > 0 ? user.inventory.weapons.join(", ") : "None", inline: false }
            );
        return message.reply({ embeds: [invEmbed] });
    }
});

/* ================= INTERACTION HANDLER (Shop Logic) ================= */
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'buy_item') return;

    let user = getUser(interaction.user.id);
    const selected = interaction.values[0]; // Format: type_id
    const [type, id] = selected.split("_");

    let item = type === "dragon" ? shopItems.dragons[id] : shopItems.weapons[id];

    // Ownership & Money Check
    if (type === "dragon" && user.inventory.dragons.includes(id)) 
        return interaction.reply({ content: "❌ Ye Dragon tere paas pehle se hai!", ephemeral: true });
    
    if (user.wallet < item.price) 
        return interaction.reply({ content: `❌ Paise kam hain! Tujhe ${item.price - user.wallet} coins aur chahiye.`, ephemeral: true });

    // Deduct money & Add to Inventory
    user.wallet -= item.price;
    if (type === "dragon") user.inventory.dragons.push(id);
    else user.inventory.weapons.push(id);
    
    save();

    await interaction.reply({ 
        content: `✅ Badhai ho! Tune **${item.name}** kharid liya! 🥳`, 
        ephemeral: false 
    });
});
/* ================= BATTLE COMMANDS ================= */
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if (!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    let user = getUser(message.author.id);

    /* --- CHALLENGE SYSTEM --- */
    if (cmd === "challenge" || cmd === "battle") {
        const target = message.mentions.users.first();
        if (!target) return message.reply("❌ Kis se ladna hai? Mention toh kar! (e.g. `s challenge @user`) ");
        if (target.id === message.author.id) return message.reply("❌ Apne aap se ladega kya? Pagal hai kya bhai? 😂");
        if (target.bot) return message.reply("❌ Bots se mat lad, wo tujhe hara denge! 🤖");

        let tUser = getUser(target.id);

        // Dragon Check
        if (!user.dragon || !tUser.dragon) {
            return message.reply("❌ Dono ke paas Dragon equipped hona chahiye! Shop se kharido aur `s set <name>` karo.");
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('accept_battle').setLabel('Accept').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('decline_battle').setLabel('Decline').setStyle(ButtonStyle.Danger)
        );

        const challengeEmbed = new EmbedBuilder()
            .setTitle("⚔️ NEW CHALLENGE!")
            .setDescription(`${message.author} ne ${target} ko maut ki chunauti di hai!\n\n**${target.username}**, kya tu taiyar hai?`)
            .setColor("#FF4500")
            .setThumbnail("https://i.imgur.com/HnKmsV5.png");

        const msg = await message.channel.send({ content: `${target}`, embeds: [challengeEmbed], components: [row] });

        // Collector for Buttons
        const filter = i => i.user.id === target.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'decline_battle') {
                await i.update({ content: `❌ ${target.username} darr gaya! Battle cancelled.`, embeds: [], components: [] });
                return collector.stop();
            }

            if (i.customId === 'accept_battle') {
                await i.update({ content: "🏁 **Battle shuru ho rahi hai... Dil thaam ke baitho!**", embeds: [], components: [] });
                
                // Battle Stats Calculation
                let p1HP = 100, p2HP = 100;
                let p1Dragon = dragons[user.dragon] || { name: "Dragon", power: 50 };
                let p2Dragon = dragons[tUser.dragon] || { name: "Dragon", power: 50 };

                const arenaEmbed = new EmbedBuilder()
                    .setTitle("🛡️ SPARK BATTLE ARENA")
                    .setColor("#FF0000");

                const battleMsg = await message.channel.send({ embeds: [arenaEmbed] });

                // LIVE ANIMATION LOOP
                const gameInterval = setInterval(async () => {
                    // Random damage based on rank and luck
                    let p1Damage = Math.floor(Math.random() * 20) + (user.rank * 2);
                    let p2Damage = Math.floor(Math.random() * 20) + (tUser.rank * 2);

                    p2HP -= p1Damage;
                    p1HP -= p2Damage;

                    // Update HP Bars
                    arenaEmbed.setFields(
                        { name: `👤 ${message.author.username}`, value: `🐉 ${p1Dragon.name}\n❤️ ${createHPBar(p1HP, 100)} ${Math.max(0, p1HP)}%`, inline: true },
                        { name: `VS`, value: `⚡`, inline: true },
                        { name: `👤 ${target.username}`, value: `🐉 ${p2Dragon.name}\n❤️ ${createHPBar(p2HP, 100)} ${Math.max(0, p2HP)}%`, inline: true }
                    );

                    await battleMsg.edit({ embeds: [arenaEmbed] });

                    // Winner Check
                    if (p1HP <= 0 || p2HP <= 0) {
                        clearInterval(gameInterval);
                        let winner = p1HP > p2HP ? message.author : target;
                        let loser = p1HP > p2HP ? target : message.author;
                        
                        let wData = getUser(winner.id);
                        let lData = getUser(loser.id);

                        wData.wins += 1;
                        wData.wallet += 10000; // Reward
                        lData.loses += 1;
                        save();

                        const winEmbed = new EmbedBuilder()
                            .setTitle("👑 VICTORY!")
                            .setDescription(`**${winner.username}** ne **${loser.username}** ko dhool chata di!\n\n💰 **Inaam:** 10,000 Coins`)
                            .setColor("#FFD700")
                            .setThumbnail(winner.displayAvatarURL());

                        return message.channel.send({ embeds: [winEmbed] });
                    }
                }, 2000); // 2 second delay per turn
            }
        });
        // Bot login (Make sure .env mein TOKEN=your_token ho)
client.login(process.env.TOKEN);
        
