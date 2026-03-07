/* ================= IMPORTS ================= */
require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fs = require('fs');

/* ================= CLIENT SETUP ================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

/* ================= PREFIX & OWNER ================= */
const PREFIXES = ['s','S','spark','Spark'];
const OWNER_ID = '1266728371719508062';

/* ================= DATABASE SETUP ================= */
if(!fs.existsSync("./database")) fs.mkdirSync("./database");
if(!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json","{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

/* ================= DATABASE FUNCTIONS ================= */
function save(){
    fs.writeFileSync("./database/users.json", JSON.stringify(users, null, 2));
}

function getUser(id){
    if(!users[id]){
        users[id] = {
            wallet:0,
            bank:0,
            gems:0,
            xp:0,
            rank:0,
            dragon:null,
            weapon:null,
            armour:null,
            inventory:{ dragons:[], weapons:[], armours:[] },
            lastDaily:0,
            wins:0,
            loses:0,
            currentChallenge:null,
            isAdmin:false
        };
    }
    return users[id];
}

/* ================= DRAGONS / WEAPONS / ARMOURS ================= */
const dragons = {
    grog: { name:"Grog", emoji:"🪨", element:"Earth" },
    phoenix: { name:"Phoenix", emoji:"🔥", element:"Fire" },
    triton: { name:"Triton", emoji:"🌊", element:"Water" },
    rex: { name:"Rex", emoji:"⚡", element:"Lightning" },
    zephyr: { name:"Zephyr", emoji:"🌪️", element:"Wind" }
};

const weapons = {
    "flame sword": { element:"Fire", attack:100 },
    "thunder blade": { element:"Lightning", attack:110 },
    "aqua spear": { element:"Water", attack:95 },
    "stone hammer": { element:"Earth", attack:105 },
    "wind dagger": { element:"Wind", attack:90 }
};

const armours = {
    "dragon plate": { element:"Fire", defence:100 },
    "thunder guard": { element:"Lightning", defence:110 },
    "aqua shield": { element:"Water", defence:95 },
    "earth armor": { element:"Earth", defence:105 },
    "zephyr cloak": { element:"Wind", defence:90 }
};

/* ================= UTILITY FUNCTIONS ================= */
function getSelectedDragon(userId){ return users[userId]?.dragon; }
function getSelectedWeapon(userId){ return users[userId]?.weapon; }
function getSelectedArmour(userId){ return users[userId]?.armour; }
function getRank(xp){ return Math.floor(xp / 2500) + 1; }

/* ================= BOT READY ================= */
client.once("ready", () => {
    console.log(`⚡ Spark Bot Online as ${client.user.tag}`);
});
/* ================= MESSAGE HANDLER – ECONOMY ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= DAILY ================= */
    if(cmd==='d'||cmd==='daily'){
        let now = Date.now();
        if(now - user.lastDaily < 86400000){
            let remaining = 86400000 - (now - user.lastDaily);
            let hrs = Math.floor(remaining / 3600000);
            let mins = Math.floor((remaining % 3600000) / 60000);
            return message.reply(`⏳ You already claimed daily! Time left: ${hrs}h ${mins}m`);
        }
        user.wallet += 500;
        user.lastDaily = now;
        save();
        return message.reply(`🎁 Daily reward claimed! +500 coins`);
    }

    /* ================= BALANCE ================= */
    if(cmd==='bal'||cmd==='balance'){
        return message.reply(`
👤 ${message.author.username}'s Balance
💼 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
        `);
    }

    /* ================= DEPOSIT ================= */
    if(cmd==='d'||cmd==='deposit'){
        let amount = args[0];
        if(amount === "all") amount = user.wallet;
        amount = parseInt(amount);
        if(!amount || amount <= 0) return message.reply("❌ Enter a valid amount");
        if(amount > user.wallet) return message.reply("❌ Not enough coins");

        user.wallet -= amount;
        user.bank += amount;
        save();
        return message.reply(`🏦 Deposited ${amount} coins to bank`);
    }

    /* ================= WITHDRAW ================= */
    if(cmd==='w'||cmd==='withdraw'){
        let amount = args[0];
        if(amount === "all") amount = user.bank;
        amount = parseInt(amount);
        if(!amount || amount <= 0) return message.reply("❌ Enter a valid amount");
        if(amount > user.bank) return message.reply("❌ Not enough coins");

        user.bank -= amount;
        user.wallet += amount;
        save();
        return message.reply(`👛 Withdrawn ${amount} coins to wallet`);
    }

    /* ================= GIVE ================= */
    if(cmd==='g'||cmd==='give'){
        const target = message.mentions.users.first();
        let amount = parseInt(args[1]);
        if(!target) return message.reply("❌ Mention a user to give coins");
        if(!amount || amount <= 0) return message.reply("❌ Enter a valid amount");
        if(amount > user.wallet) return message.reply("❌ Not enough coins");

        let targetUser = getUser(target.id);
        user.wallet -= amount;
        targetUser.wallet += amount;
        save();
        return message.reply(`💸 Sent ${amount} coins to ${target.username}`);
    }
});
/* ================= MESSAGE HANDLER – GAMES / PROFILE ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= COINFLIP ================= */
    if(cmd==='cf'||cmd==='coinflip'){
        let bet = args[0];
        if(!bet) return message.reply("❌ Enter an amount or 'all'");
        if(bet.toLowerCase() === 'all') bet = Math.min(user.wallet, 100000);
        else bet = parseInt(bet);
        if(bet <= 0) return message.reply("❌ Enter a valid bet");
        if(bet > user.wallet) return message.reply("❌ Not enough coins");

        // Deduct bet
        user.wallet -= bet;
        save();

        const sides = ["Heads","Tails"];
        let choice = sides[Math.floor(Math.random()*2)];

        let msgSent = await message.channel.send(`🪙 Coin is flipping...`);
        setTimeout(()=>{
            let won = Math.random() < 0.5;
            if(won){
                user.wallet += bet*2;
                save();
                msgSent.edit(`🪙 Coin landed on **${choice}**! You won ${bet*2} coins!`);
            } else {
                msgSent.edit(`🪙 Coin landed on **${choice}**! You lost ${bet} coins!`);
            }
        },2000);
    }

    /* ================= SLOT ================= */
    if(cmd==='s'||cmd==='slot'){
        let bet = args[0];
        if(!bet) return message.reply("❌ Enter an amount or 'all'");
        if(bet.toLowerCase() === 'all') bet = Math.min(user.wallet, 100000);
        else bet = parseInt(bet);
        if(bet <=0) return message.reply("❌ Enter a valid bet");
        if(bet>user.wallet) return message.reply("❌ Not enough coins");

        const symbols = ["💎","🍉","🥭"];
        user.wallet -= bet;
        save();
        let msgSent = await message.channel.send("🎰 Spinning the slot machine...");

        setTimeout(()=>{
            const roll = [symbols[Math.floor(Math.random()*3)],symbols[Math.floor(Math.random()*3)],symbols[Math.floor(Math.random()*3)]];
            let resultText;
            if(roll[0]===roll[1] && roll[1]===roll[2]){
                if(roll[0]==="💎") resultText = `💎💎💎 Jackpot! You won ${bet*3} coins!`; 
                else if(roll[0]==="🥭") resultText = `🥭🥭🥭 You won ${bet*2} coins!`;
                else resultText = `🍉🍉🍉 Tie! Your bet returned`; user.wallet += bet;
            } else resultText = `${roll.join('')} - You lost ${bet} coins!`;

            // Reward calculation
            if(roll[0]==="💎" && roll[1]==="💎" && roll[2]==="💎") user.wallet += bet*3;
            else if(roll[0]==="🥭" && roll[1]==="🥭" && roll[2]==="🥭") user.wallet += bet*2;
            else if(roll[0]==roll[1] && roll[1]==roll[2] && roll[0]==="🍉") user.wallet += bet; // tie
            save();
            msgSent.edit(`🎰 ${roll.join('')}\n${resultText}`);
        },2000);
    }

    /* ================= DRAGON / ARMOUR / WEAPON SELECT ================= */
    if(cmd==='set'){
        const type = args[0]?.toLowerCase();
        const name = args.slice(1).join(' ').toLowerCase();
        if(!type || !name) return message.reply("❌ Usage: s set dragon/weapon/armour <name>");
        if(type==='dragon'){
            if(!user.inventory.dragons.includes(name)) return message.reply("❌ You don't own this dragon");
            user.dragon = name;
            save();
            return message.reply(`✅ Selected dragon: ${dragons[name]?.emoji} ${dragons[name]?.name}`);
        }
        if(type==='weapon'){
            if(!user.inventory.weapons.includes(name)) return message.reply("❌ You don't own this weapon");
            user.weapon = name;
            save();
            return message.reply(`✅ Selected weapon: ${name}`);
        }
        if(type==='armour'){
            if(!user.inventory.armours.includes(name)) return message.reply("❌ You don't own this armour");
            user.armour = name;
            save();
            return message.reply(`✅ Selected armour: ${name}`);
        }
        return message.reply("❌ Unknown type! Use dragon/weapon/armour");
    }

    /* ================= PROFILE ================= */
    if(cmd==='profile'){
        const avatar = message.author.displayAvatarURL({dynamic:true});
        return message.reply({
            content: `👤 **${message.author.username} Profile**
Rank: ${user.rank} | XP: ${user.xp}/2500
🐉 Dragon: ${user.dragon?dragons[user.dragon].emoji + " " + dragons[user.dragon].name:"None"}
⚔ Weapon: ${user.weapon||"None"}
🛡 Armour: ${user.armour||"None"}
💰 Wallet: ${user.wallet} | 🏦 Bank: ${user.bank} | 💎 Gems: ${user.gems}
🎮 Wins: ${user.wins} | 💀 Loses: ${user.loses}`,
            files: [avatar]
        });
    }

    /* ================= INVENTORY ================= */
    if(cmd==='inv'){
        return message.reply(`
🎒 **INVENTORY**
🐉 Dragons: ${user.inventory.dragons.length?user.inventory.dragons.map(d=>dragons[d]?.emoji+" "+dragons[d]?.name).join(", "):"None"}
⚔ Weapons: ${user.inventory.weapons.join(", ") || "None"}
🛡 Armours: ${user.inventory.armours.join(", ") || "None"}
        `);
    }
});
/* ================= MESSAGE HANDLER – BATTLE / LEADERBOARD / SHOP ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= CHALLENGE BATTLE ================= */
    if(cmd==='challenge'){
        const target = message.mentions.users.first();
        if(!target) return message.reply("❌ Mention a user to challenge");
        if(!user.dragon) return message.reply("❌ You must select a dragon first");
        let tUser = getUser(target.id);
        if(!tUser.dragon) return message.reply("❌ Target must have a dragon selected");

        user.currentChallenge = { target: target.id, status: "pending" };
        tUser.currentChallenge = { challenger: userId, status: "pending" };

        return message.reply(`⚔ Challenge sent to ${target.username}! Waiting for acceptance...`);
    }

    if(cmd==='accept'){
        if(!user.currentChallenge || !user.currentChallenge.challenger) return message.reply("❌ No challenge to accept");
        const challengerId = user.currentChallenge.challenger;
        let challenger = getUser(challengerId);
        if(!challenger) return message.reply("❌ Challenger not found");

        // Initialize HP
        let acceptorHP = 100, challengerHP = 100;

        let arenaMsg = await message.channel.send(`
╔━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╗
      ⚔️ BATTLE ARENA ⚔️
╠━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╣
  ACCEPTOR               ║  CHALLENGER
   @${message.author.username}           ║  @${client.users.cache.get(challengerId)?.username}
╠━━━━━━━━━━━━━━╬━━━━━━━━━━━━━━╣
 ${dragons[user.dragon]?.emoji} ${dragons[user.dragon]?.name}              ║  ${dragons[challenger.dragon]?.emoji} ${dragons[challenger.dragon]?.name}
 ⭐ LVL 99                  ║  ⭐ LVL 99
 🛡️ ${dragons[user.dragon]?.element}                 ║  ☄️ ${dragons[challenger.dragon]?.element}
╠━━━━━━━━━━━━━━╬━━━━━━━━━━━━━━╣
        ❤️ [■■■■■□]  ║  ❤️ [■■■■□□]
                        90%       ║     85%
╠━━━━━━━━━━━━━━╬━━━━━━━━━━━━━━╣
 📢 STATUS: BATTLE IN PROGRESS
╚━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╝
        `);

        // Simple live HP simulation (just delay for demo)
        let interval = setInterval(()=>{
            acceptorHP -= Math.floor(Math.random()*10);
            challengerHP -= Math.floor(Math.random()*10);

            if(acceptorHP<=0 || challengerHP<=0){
                clearInterval(interval);
                if(acceptorHP>challengerHP){
                    user.wins+=1; challenger.loses+=1;
                    arenaMsg.edit(`🏆 ${message.author.username} wins the battle!`);
                } else if(challengerHP>acceptorHP){
                    challenger.wins+=1; user.loses+=1;
                    arenaMsg.edit(`🏆 ${client.users.cache.get(challengerId)?.username} wins the battle!`);
                } else arenaMsg.edit(`⚖ The battle ended in a tie!`);
                user.currentChallenge = null; challenger.currentChallenge = null;
                save();
            } else {
                // Update HP bar live (optional detailed update)
            }
        },2000);
    }

    /* ================= LEADERBOARDS ================= */
    if(cmd==='lb'||cmd==='leaderboard'){
        const sub = args[0]?.toLowerCase();
        if(sub==='balance'||sub==='b'){
            let sorted = Object.entries(users).sort((a,b)=>b[1].wallet+b[1].bank-(a[1].wallet+a[1].bank));
            let text = sorted.slice(0,10).map(([id,u],i)=>`${i+1}. <@${id}> - Wallet: ${u.wallet} | Bank: ${u.bank} | Gems: ${u.gems}`).join("\n");
            return message.reply(`💰 **Balance Leaderboard**\n${text}`);
        }
        if(sub==='battles'||sub==='c'){
            let sorted = Object.entries(users).sort((a,b)=>b[1].wins-(a[1].wins));
            let text = sorted.slice(0,10).map(([id,u],i)=>`${i+1}. <@${id}> - Wins: ${u.wins} | Loses: ${u.loses}`).join("\n");
            return message.reply(`⚔ **Battle Leaderboard**\n${text}`);
        }
    }

    /* ================= SHOP ================= */
    if(cmd==='shop'){
        return message.reply(`
🛒 **SHOP CATEGORIES**
🐉 Dragons: ${Object.keys(dragons).join(", ")}
⚔ Weapons: ${Object.keys(weapons).join(", ")}
🛡 Armours: ${Object.keys(armours).join(", ")}
Use s buy <item name>
        `);
    }
});
/* ================= MESSAGE HANDLER – ADMIN & OWNER ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= SERVER ADMIN COMMANDS ================= */
    if(cmd==='disable'){
        if(!message.member.permissions.has("Administrator")) return;
        message.reply("✅ Bot disabled in this channel");
        // Implement channel disable logic if needed
    }
    if(cmd==='enable'){
        if(!message.member.permissions.has("Administrator")) return;
        message.reply("✅ Bot enabled in this channel");
        // Implement channel enable logic if needed
    }

    /* ================= BOT OWNER COMMANDS ================= */
    if(userId!==OWNER_ID) return; // owner-only commands below

    if(cmd==='setmoney'){
        const target = message.mentions.users.first();
        let amount = parseInt(args[1]);
        if(!target || !amount) return message.reply("❌ Usage: s setmoney @user <amount>");
        let tUser = getUser(target.id);
        tUser.wallet = amount;
        save();
        return message.reply(`✅ Set ${target.username}'s wallet to ${amount}`);
    }

    if(cmd==='setgems'){
        const target = message.mentions.users.first();
        let amount = parseInt(args[1]);
        if(!target || !amount) return message.reply("❌ Usage: s setgems @user <amount>");
        let tUser = getUser(target.id);
        tUser.gems = amount;
        save();
        return message.reply(`✅ Set ${target.username}'s gems to ${amount}`);
    }

    if(cmd==='admin'){
        const sub = args[0]?.toLowerCase();
        const target = message.mentions.users.first();
        if(sub==='add'){
            if(!target) return message.reply("❌ Mention a user to add admin");
            let tUser = getUser(target.id);
            tUser.isAdmin = true;
            save();
            return message.reply(`✅ ${target.username} is now bot admin`);
        }
        if(sub==='remove'){
            if(!target) return message.reply("❌ Mention a user to remove admin");
            let tUser = getUser(target.id);
            tUser.isAdmin = false;
            save();
            return message.reply(`✅ ${target.username} removed from bot admin`);
        }
        if(sub==='list'){
            let list = Object.entries(users).filter(([id,u])=>u.isAdmin).map(([id,u])=>`<@${id}>`);
            return message.reply(`👑 Bot Admins:\n${list.join("\n") || "None"}`);
        }
    }

    if(cmd==='resetall'){
        users = {};
        save();
        return message.reply("⚠ All user data reset!");
    }
});

/* ================= BOT LOGIN ================= */
client.login(process.env.TOKEN);
