// index.js
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { users } = require('./Database/user');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel]
});

// Bot prefix
const PREFIX = 's';

// Ready Event
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

// Message Event
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    // Ensure user exists in database
    if (!users[message.author.id]) {
        users[message.author.id] = {
            wallet: 1000,
            bank: 0,
            gems: 0,
            xp: 0,
            rank: 1,
            daily: false
        };
    }

    const userData = users[message.author.id];

    // Economy Commands
    if (cmd === 'bal') {
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username}'s Balance`)
            .setColor('Gold')
            .addFields(
                { name: 'Wallet', value: `${userData.wallet} 💼`, inline: true },
                { name: 'Bank', value: `${userData.bank} 🏦`, inline: true },
                { name: 'Gems', value: `${userData.gems} 💎`, inline: true }
            );
        message.reply({ embeds: [embed] });
    }

    else if (cmd === 'daily') {
        if (userData.daily) {
            return message.reply(`⏳ Daily already claimed!`);
        }
        userData.wallet += 1000;
        userData.daily = true;
        message.reply(`🎁 Daily reward claimed!\n+1000 💼 coins`);
    }

    else if (cmd === 'deposit') {
        let amount = parseInt(args[0]);
        if (isNaN(amount)) return message.reply('❌ Enter a valid number!');
        if (amount > userData.wallet) return message.reply('❌ Not enough coins in wallet!');
        userData.wallet -= amount;
        userData.bank += amount;
        message.reply(`🏦 Deposit Successful\n${amount} 💼 moved to bank`);
    }

    else if (cmd === 'withdraw') {
        let amount = parseInt(args[0]);
        if (isNaN(amount)) return message.reply('❌ Enter a valid number!');
        if (amount > userData.bank) return message.reply('❌ Not enough coins in bank!');
        userData.bank -= amount;
        userData.wallet += amount;
        message.reply(`💸 Withdrawal Successful\n${amount} 💼 moved to wallet`);
    }
});
// PART 2: Gambling System (Coinflip + Slot Machine)

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const prefix = 's ';
let users = {}; // Temporary in-memory user data for demo

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Ensure user data exists
    if (!users[message.author.id]) {
        users[message.author.id] = { wallet: 5000, bank: 0, gems: 50 };
    }

    // Coinflip Command
    if (command === 'cf') {
        let bet = args[0] === 'all' ? users[message.author.id].wallet : parseInt(args[0]);
        if (!bet || bet <= 0) return message.channel.send('❌ Enter a valid bet!');
        if (bet > users[message.author.id].wallet) return message.channel.send('❌ Not enough coins!');

        let msg = await message.channel.send('🪙 Coinflip: Flipping...');
        let chance = Math.random();
        if (chance <= 0.3) {
            // WIN
            users[message.author.id].wallet += bet;
            msg.edit(`🪙 Coinflip Result: **WIN**\n+${bet} 💼\nWallet: ${users[message.author.id].wallet}`);
        } else {
            // LOSE
            users[message.author.id].wallet -= bet;
            msg.edit(`🪙 Coinflip Result: **LOSE**\n-${bet} 💼\nWallet: ${users[message.author.id].wallet}`);
        }
    }

    // Slot Command
    if (command === 'slot') {
        let bet = args[0] === 'all' ? users[message.author.id].wallet : parseInt(args[0]);
        if (!bet || bet <= 0) return message.channel.send('❌ Enter a valid bet!');
        if (bet > users[message.author.id].wallet) return message.channel.send('❌ Not enough coins!');

        const emojis = ['💎','🥭','🍒','🍉'];
        const spin = () => [emojis[Math.floor(Math.random()*emojis.length)],
                            emojis[Math.floor(Math.random()*emojis.length)],
                            emojis[Math.floor(Math.random()*emojis.length)]];

        let msg = await message.channel.send('🎰 Slot Machine\n❔ | ❔ | ❔');
        let results = [spin(), spin(), spin(), spin()];
        
        for (let i = 0; i < results.length; i++) {
            await new Promise(res => setTimeout(res, 700)); // spin animation timing
            msg.edit(`🎰 Slot Machine\n${results[i].join(' | ')}`);
        }

        const final = results[results.length-1];
        let win = 0;

        if (final[0] === final[1] && final[1] === final[2]) {
            if (final[0] === '💎') win = bet*3;
            else win = bet*2;
            users[message.author.id].wallet += win;
            msg.edit(`🎰 Slot Machine\n${final.join(' | ')}\n🎉 WIN! +${win} 💼\nWallet: ${users[message.author.id].wallet}`);
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
            // Partial match → bet returned
            msg.edit(`🎰 Slot Machine\n${final.join(' | ')}\n🔄 Bet returned\nWallet: ${users[message.author.id].wallet}`);
        } else {
            users[message.author.id].wallet -= bet;
            msg.edit(`🎰 Slot Machine\n${final.join(' | ')}\n❌ You lost! -${bet} 💼\nWallet: ${users[message.author.id].wallet}`);
        }
    }
});
// PART 3: Bank System + Daily Rewards + Profile & Rank

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const prefix = 's ';
let users = {}; // Temporary in-memory user data
let dailyCooldown = {}; // Track daily claim timestamps

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Ensure user exists
    if (!users[message.author.id]) {
        users[message.author.id] = { wallet: 5000, bank: 0, gems: 50, xp: 0, rank: 1 };
    }

    // ===== Bank Commands =====
    if (command === 'deposit') {
        let amount = args[0] === 'all' ? users[message.author.id].wallet : parseInt(args[0]);
        if (!amount || amount <= 0) return message.channel.send('❌ Enter a valid amount!');
        if (amount > users[message.author.id].wallet) return message.channel.send('❌ Not enough coins in wallet!');
        users[message.author.id].wallet -= amount;
        users[message.author.id].bank += amount;
        return message.channel.send(`🏦 Deposit Successful\n${amount} 💼 moved to bank\nWallet: ${users[message.author.id].wallet} | Bank: ${users[message.author.id].bank}`);
    }

    if (command === 'withdraw') {
        let amount = args[0] === 'all' ? users[message.author.id].bank : parseInt(args[0]);
        if (!amount || amount <= 0) return message.channel.send('❌ Enter a valid amount!');
        if (amount > users[message.author.id].bank) return message.channel.send('❌ Not enough coins in bank!');
        users[message.author.id].bank -= amount;
        users[message.author.id].wallet += amount;
        return message.channel.send(`💸 Withdraw Successful\n${amount} 💼 moved to wallet\nWallet: ${users[message.author.id].wallet} | Bank: ${users[message.author.id].bank}`);
    }

    // ===== Daily Command =====
    if (command === 'daily') {
        let lastClaim = dailyCooldown[message.author.id] || 0;
        const now = Date.now();
        if (now - lastClaim < 24*60*60*1000) {
            const remaining = 24*60*60*1000 - (now - lastClaim);
            const hours = Math.floor(remaining/3600000);
            const mins = Math.floor((remaining%3600000)/60000);
            return message.channel.send(`⏳ Daily Already Claimed\nNext claim in: ${hours}h ${mins}m`);
        }
        const reward = 1000;
        users[message.author.id].wallet += reward;
        dailyCooldown[message.author.id] = now;
        return message.channel.send(`🎁 Daily Reward\n+${reward} 💼\nWallet: ${users[message.author.id].wallet}`);
    }

    // ===== Balance Command =====
    if (command === 'bal') {
        const u = users[message.author.id];
        return message.channel.send(`👨‍💼 ${message.author.username}\n💼 : ${u.wallet}\n🏦 : ${u.bank}\n💎 : ${u.gems}`);
    }

    // ===== Profile Command =====
    if (command === 'profile') {
        const u = users[message.author.id];
        return message.channel.send(`👤 ${message.author.username}\n━━━━━━━━━━━━━━\nRank : ${u.rank}\nXP : ${u.xp}/5000\n💼 Wallet : ${u.wallet}\n🏦 Bank : ${u.bank}\n💎 Gems : ${u.gems}`);
    }

    // ===== Rank / XP System =====
    // 1 message = 1 XP
    users[message.author.id].xp += 1;
    if (users[message.author.id].xp >= 5000) {
        users[message.author.id].rank += 1;
        users[message.author.id].xp = 0;
        message.channel.send(`🎉 Rank Up!\n${message.author.username} reached Rank ${users[message.author.id].rank}`);
    }
});
// PART 4: Dragon System + Shop + Buy/Set/Upgrade + Battle Skeleton

// Dragon definitions
const dragons = {
    phoenix: { element: '🔥', price: 10000000, level: 1 },
    triton: { element: '🌊', price: 8000000, level: 1 },
    rex: { element: '⚡', price: 9000000, level: 1 },
    zephyr: { element: '🍃', price: 7000000, level: 1 },
    grog: { element: '🪨', price: 6000000, level: 1 }
};

// Weapon & Armour (simplified)
const weapons = {
    flameblade: { element: '🔥', price: 5000000, atk: 25 },
    stormspear: { element: '⚡', price: 4500000, atk: 22 },
    oceantrident: { element: '🌊', price: 4000000, atk: 20 },
    windkatana: { element: '🍃', price: 3500000, atk: 18 },
    earthhammer: { element: '🪨', price: 3000000, atk: 17 }
};

const armours = {
    phoenix: { element: '🔥', price: 5000000, def: 25 },
    storm: { element: '⚡', price: 4500000, def: 22 },
    ocean: { element: '🌊', price: 4000000, def: 20 },
    wind: { element: '🍃', price: 3500000, def: 18 },
    earth: { element: '🪨', price: 3000000, def: 17 }
};

// Initialize user inventory if missing
client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const user = users[message.author.id];

    if (!user.dragons) user.dragons = {};
    if (!user.selectedDragon) user.selectedDragon = null;
    if (!user.weapons) user.weapons = {};
    if (!user.selectedWeapon) user.selectedWeapon = null;
    if (!user.armours) user.armours = {};
    if (!user.selectedArmour) user.selectedArmour = null;

    // ===== Shop Commands =====
    if (command === 'shop') {
        const category = args[0];
        if (!category) return message.channel.send('🛒 Select a category: dragons / weapons / armour');
        if (category === 'dragons') {
            let shopMsg = '🐉 DRAGON SHOP\n\n';
            for (const [key, d] of Object.entries(dragons)) {
                shopMsg += `${d.element} ${key.charAt(0).toUpperCase() + key.slice(1)} - ${d.price.toLocaleString()} coins\n`;
            }
            shopMsg += `\nBuy with: s buy dragon <name>`;
            return message.channel.send(shopMsg);
        }
        if (category === 'weapons') {
            let shopMsg = '⚔ WEAPON SHOP\n\n';
            for (const [key, w] of Object.entries(weapons)) {
                shopMsg += `${key.charAt(0).toUpperCase() + key.slice(1)} (${w.element}) - ${w.price.toLocaleString()} coins | ATK +${w.atk}%\n`;
            }
            shopMsg += `\nBuy with: s buy weapon <name>`;
            return message.channel.send(shopMsg);
        }
        if (category === 'armour') {
            let shopMsg = '🛡 ARMOUR SHOP\n\n';
            for (const [key, a] of Object.entries(armours)) {
                shopMsg += `${key.charAt(0).toUpperCase() + key.slice(1)} (${a.element}) - ${a.price.toLocaleString()} coins | DEF +${a.def}%\n`;
            }
            shopMsg += `\nBuy with: s buy armour <name>`;
            return message.channel.send(shopMsg);
        }
    }

    // ===== Buy Commands =====
    if (command === 'buy') {
        const type = args[0];
        const name = args[1]?.toLowerCase();
        if (!type || !name) return message.channel.send('❌ Usage: s buy <dragon/weapon/armour> <name>');

        if (type === 'dragon') {
            const dragon = dragons[name];
            if (!dragon) return message.channel.send('❌ Invalid dragon!');
            if (user.wallet < dragon.price) return message.channel.send('❌ Not enough coins!');
            user.wallet -= dragon.price;
            user.dragons[name] = { ...dragon };
            return message.channel.send(`✅ Purchase Successful\nYou bought ${dragon.element} ${name.charAt(0).toUpperCase() + name.slice(1)}\nWallet: ${user.wallet}`);
        }

        if (type === 'weapon') {
            const weapon = weapons[name];
            if (!weapon) return message.channel.send('❌ Invalid weapon!');
            if (user.wallet < weapon.price) return message.channel.send('❌ Not enough coins!');
            user.wallet -= weapon.price;
            user.weapons[name] = { ...weapon };
            return message.channel.send(`✅ Purchase Successful\nYou bought ${name.charAt(0).toUpperCase() + name.slice(1)}\nWallet: ${user.wallet}`);
        }

        if (type === 'armour') {
            const armour = armours[name];
            if (!armour) return message.channel.send('❌ Invalid armour!');
            if (user.wallet < armour.price) return message.channel.send('❌ Not enough coins!');
            user.wallet -= armour.price;
            user.armours[name] = { ...armour };
            return message.channel.send(`✅ Purchase Successful\nYou bought ${name.charAt(0).toUpperCase() + name.slice(1)}\nWallet: ${user.wallet}`);
        }
    }

    // ===== Set Selected =====
    if (command === 'set') {
        const type = args[0];
        const name = args[1]?.toLowerCase();
        if (!type || !name) return message.channel.send('❌ Usage: s set <dragon/weapon/armour> <name>');

        if (type === 'dragon' && user.dragons[name]) {
            user.selectedDragon = name;
            return message.channel.send(`✅ Dragon set: ${name.charAt(0).toUpperCase() + name.slice(1)}`);
        }
        if (type === 'weapon' && user.weapons[name]) {
            user.selectedWeapon = name;
            return message.channel.send(`✅ Weapon set: ${name.charAt(0).toUpperCase() + name.slice(1)}`);
        }
        if (type === 'armour' && user.armours[name]) {
            user.selectedArmour = name;
            return message.channel.send(`✅ Armour set: ${name.charAt(0).toUpperCase() + name.slice(1)}`);
        }
    }

    // ===== Upgrade Dragon =====
    if (command === 'upgrade') {
        const selected = user.selectedDragon;
        if (!selected) return message.channel.send('❌ No dragon selected!');
        const cost = 100; // Gems per level
        if (user.gems < cost) return message.channel.send('❌ Not enough gems!');
        user.dragons[selected].level += 1;
        user.gems -= cost;
        return message.channel.send(`${selected.charAt(0).toUpperCase() + selected.slice(1)} upgraded to Level ${user.dragons[selected].level}\nGems left: ${user.gems}`);
    }

    // ===== Battle Skeleton =====
    if (command === 'battle') {
        const opponent = message.mentions.users.first();
        if (!opponent) return message.channel.send('❌ Mention a user to battle!');
        if (!users[opponent.id]) return message.channel.send('❌ Opponent not found!');

        const playerDragon = user.dragons[user.selectedDragon];
        const opponentDragon = users[opponent.id].dragons[users[opponent.id].selectedDragon];

        if (!playerDragon || !opponentDragon) return message.channel.send('❌ Both players must have a selected dragon!');

        return message.channel.send(`⚔ DRAGON BATTLE START!\n${message.author.username} (${user.selectedDragon}) vs ${opponent.username} (${users[opponent.id].selectedDragon})\n🔥 Battle engine coming in Part 5`);
    }
});
// PART 5: Full Dragon Battle Engine + Slot/Gambling + Help + Leaderboard

client.on('messageCreate', async message => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const user = users[message.author.id];

    // ===== SLOT SYSTEM =====
    if (command === 'slot') {
        let bet = parseInt(args[0]);
        if (!bet || bet <= 0) return message.channel.send('❌ Enter a valid amount!');
        if (bet > user.wallet) return message.channel.send('❌ Not enough coins!');

        const emojis = ['💎','🍉','🍒','🥭'];
        const spin = () => emojis[Math.floor(Math.random() * emojis.length)];
        let result = [spin(), spin(), spin()];

        let slotMsg = await message.channel.send(`🎰 Slot Machine\n\n❔ | ❔ | ❔`);

        const edits = [
            `${result[0]} | ${spin()} | ${spin()}`,
            `${spin()} | ${result[1]} | ${spin()}`,
            `${spin()} | ${spin()} | ${result[2]}`,
            `${result[0]} | ${result[1]} | ${result[2]}`
        ];

        for (let i = 0; i < edits.length; i++) {
            await new Promise(r => setTimeout(r, 600));
            await slotMsg.edit(`🎰 Slot Machine\n\n${edits[i]}`);
        }

        // Evaluate result
        if (result[0] === result[1] && result[1] === result[2]) {
            let reward = bet * 3;
            user.wallet += reward;
            slotMsg.edit(`🎰 Slot Machine\n\n${result.join(' | ')}\n🎉 JACKPOT!\nReward: ${reward} 💼`);
        } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
            let reward = bet * 2;
            user.wallet += reward;
            slotMsg.edit(`🎰 Slot Machine\n\n${result.join(' | ')}\n🎉 Partial Win!\nReward: ${reward} 💼`);
        } else {
            user.wallet -= bet;
            slotMsg.edit(`🎰 Slot Machine\n\n${result.join(' | ')}\n❌ You lost!\n-${bet} 💼`);
        }
    }

    // ===== DRAGON BATTLE ENGINE =====
    if (command === 'battle') {
        const opponent = message.mentions.users.first();
        if (!opponent || !users[opponent.id]) return message.channel.send('❌ Mention a valid opponent!');

        const playerDragon = user.dragons[user.selectedDragon];
        const opponentDragon = users[opponent.id].dragons[users[opponent.id].selectedDragon];

        if (!playerDragon || !opponentDragon) return message.channel.send('❌ Both players must have a selected dragon!');

        let playerHP = 500 + playerDragon.level * 38;
        let opponentHP = 500 + opponentDragon.level * 38;
        let turn = 0;

        const battleMsg = await message.channel.send(`⚔ DRAGON BATTLE\n\n${message.author.username} (${user.selectedDragon}) HP: ${playerHP}\n${opponent.username} (${users[opponent.id].selectedDragon}) HP: ${opponentHP}\n\nBattle starting...`);

        while (playerHP > 0 && opponentHP > 0) {
            await new Promise(r => setTimeout(r, 1000));

            if (turn % 2 === 0) {
                let dmg = Math.floor(50 + Math.random() * 50);
                opponentHP -= dmg;
                if (opponentHP < 0) opponentHP = 0;
                await battleMsg.edit(`⚔ DRAGON BATTLE\n\n${message.author.username} (${user.selectedDragon}) HP: ${playerHP}\n${opponent.username} (${users[opponent.id].selectedDragon}) HP: ${opponentHP}\n\n👊 ${user.selectedDragon} used Attack! Damage: ${dmg}`);
            } else {
                let dmg = Math.floor(50 + Math.random() * 50);
                playerHP -= dmg;
                if (playerHP < 0) playerHP = 0;
                await battleMsg.edit(`⚔ DRAGON BATTLE\n\n${message.author.username} (${user.selectedDragon}) HP: ${playerHP}\n${opponent.username} (${users[opponent.id].selectedDragon}) HP: ${opponentHP}\n\n🌊 ${opponentDragon.element} used Attack! Damage: ${dmg}`);
            }
            turn++;
        }

        // Determine winner
        let winner, loser;
        if (playerHP > 0) {
            winner = message.author;
            loser = opponent;
            user.gems += 5;
            user.wallet += 2000;
        } else {
            winner = opponent;
            loser = message.author;
            user.gems -= 5;
        }

        await battleMsg.edit(`🏆 BATTLE FINISHED\n\nWinner: ${winner.username}\nRewards:\n💎 Gems: ${user.gems}\n💰 Coins: ${user.wallet}`);
    }

    // ===== HELP COMMAND =====
    if (command === 'help') {
        const helpMsg = `
📜 SPARKLE EMPIRE BOT COMMANDS

👤 USER COMMANDS
s profile      → View your profile
s rank         → Check your rank & XP
s shop         → Open shop categories
s buy          → Buy dragons / weapons / armour
s set          → Select dragon / weapon / armour
s upgrade      → Upgrade your selected dragon
s battle       → Start dragon battle
s deposit      → Transfer coins to bank
s withdraw     → Withdraw coins from bank
s inventory    → View your items
s lb balance   → Coins & gems leaderboard
s lb battles   → Battle wins leaderboard

━━━━━━━━━━━━━━

🛡 SERVER ADMIN COMMANDS
s disable      → Disable bot commands in a channel
s enable       → Enable bot commands in a channel
⚠ Hidden Commands for owner/admin only`;
        message.channel.send(helpMsg);
    }

    // ===== LEADERBOARD =====
    if (command === 'lb') {
        const type = args[0];
        if (!type) return message.channel.send('❌ Usage: s lb <balance/battles>');

        let leaderboard = [];
        if (type === 'balance') {
            leaderboard = Object.entries(users)
                .map(([id, u]) => ({ id, wallet: u.wallet, gems: u.gems }))
                .sort((a,b) => (b.wallet+b.gems) - (a.wallet+a.gems))
                .slice(0,10);

            let msg = '🏆 BALANCE LEADERBOARD\n\n';
            leaderboard.forEach((u,i) => {
                const member = await message.guild.members.fetch(u.id).catch(()=>({user:{username:'Unknown'}}));
                msg += `${i+1}️⃣ @${member.user.username} | 💰 Coins: ${u.wallet} | 💎 Gems: ${u.gems}\n`;
            });
            return message.channel.send(msg);
        }

        if (type === 'battles') {
            leaderboard = Object.entries(users)
                .map(([id,u]) => ({ id, wins: u.battleWins || 0 }))
                .sort((a,b)=>b.wins - a.wins)
                .slice(0,10);

            let msg = '⚔ BATTLE LEADERBOARD\n\n';
            leaderboard.forEach((u,i)=>{
                const member = await message.guild.members.fetch(u.id).catch(()=>({user:{username:'Unknown'}}));
                msg += `${i+1}️⃣ @${member.user.username} | Wins: ${u.wins}\n`;
            });
            return message.channel.send(msg);
        }
    }
});

/* ================= LOGIN BOT ================= */
client.login(process.env.TOKEN);
