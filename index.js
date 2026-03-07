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
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json","{}");

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
            inventory:{ dragons:[], weapons:[], armours:[] },
            lastDaily:0,
            wins:0,
            loses:0,
            currentChallenge:null // for live battle
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
function getRank(xp){ return Math.floor(xp / 2500) + 1; }

/* ================= BOT READY ================= */
client.once("ready", () => {
    console.log(`⚡ Spark Bot Online as ${client.user.tag}`);
});
/* ================= MESSAGE HANDLER – ECONOMY ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    // Check prefix
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
/* ================= MESSAGE HANDLER – GAMES & DRAGONS ================= */
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
        let bet = parseInt(args[0]);
        if(!bet || bet <= 0) return message.reply("❌ Enter a valid bet");
        if(bet > 100000) bet = 100000;
        if(user.wallet < bet) return message.reply("❌ Not enough coins");

        user.wallet -= bet;
        save();

        const result = Math.random() < 0.5 ? "Heads" : "Tails";
        await message.reply("🪙 Flipping... ⏳");
        setTimeout(()=>{
            if(result==="Heads"){ user.wallet += bet*2; message.channel.send(`🎉 Heads! You won ${bet*2} coins`);}
            else message.channel.send(`😢 Tails! You lost ${bet} coins`);
            save();
        },2000);
    }

    /* ================= SLOT ================= */
    if(cmd==='s'||cmd==='slot'){
        let bet = parseInt(args[0]);
        if(!bet || bet <= 0) return message.reply("❌ Enter a valid bet");
        if(bet > 100000) bet = 100000;
        if(user.wallet < bet) return message.reply("❌ Not enough coins");

        user.wallet -= bet;
        save();

        const symbols = ["💎","🥭","🍉"];
        const roll = [symbols[Math.floor(Math.random()*3)], symbols[Math.floor(Math.random()*3)], symbols[Math.floor(Math.random()*3)]];
        await message.reply("🎰 Rolling... ⏳");

        setTimeout(()=>{
            const [a,b,c] = roll;
            let msg = `🎰 Result: ${a}${b}${c}\n`;
            if(a===b && b===c){
                if(a==="💎"){ user.wallet += bet*3; msg+=`💎 Jackpot! You won ${bet*3} coins`;}
                else if(a==="🥭"){ user.wallet += bet*2; msg+=`🥭 You won ${bet*2} coins`;}
                else { user.wallet += bet; msg+=`🍉 Tie! Bet returned`;}
            } else msg+=`😢 You lost ${bet} coins`;
            message.channel.send(msg);
            save();
        },2500);
    }

    /* ================= DRAGON SELECTION ================= */
    if(cmd==='set'){
        const dragonName = args.join(' ').toLowerCase();
        if(!dragons[dragonName]) return message.reply("❌ Dragon not found!");
        user.dragon = dragonName;
        save();
        return message.reply(`${dragons[dragonName].emoji} ${dragons[dragonName].name} selected!`);
    }

    /* ================= FEED DRAGON ================= */
    if(cmd==='feed'){
        if(!user.dragon) return message.reply("❌ Select a dragon first!");
        if(user.gems < 100) return message.reply("❌ Not enough gems to feed!");
        let level = user.inventory.dragons[user.dragon] || 1;
        if(level >= 250) return message.reply("❌ Max level 250");
        user.gems -= 100;
        user.inventory.dragons[user.dragon] = level + 1;
        save();
        return message.reply(`🔥 ${dragons[user.dragon].name} leveled up! ⭐ Level: ${level+1}`);
    }

    /* ================= PROFILE ================= */
    if(cmd==='profile'){
        const dragon = user.dragon;
        const dragonLvl = user.inventory.dragons[dragon] || 0;
        message.reply(`
👤 ${message.author.username}
🐉 Dragon: ${dragon ? dragons[dragon].emoji+" "+dragon+" (Lvl "+dragonLvl+")" : "None"}
💼 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
🏆 Rank: #${user.rank} | XP: ${user.xp}
        `);
    }

    /* ================= INVENTORY ================= */
    if(cmd==='inv'){
        message.reply(`
🎒 Inventory:
🐉 Dragons: ${user.inventory.dragons.join(", ") || "None"}
⚔ Weapons: ${user.inventory.weapons.join(", ") || "None"}
🛡 Armours: ${user.inventory.armours.join(", ") || "None"}
        `);
    }
});
/* ================= MESSAGE HANDLER – BATTLE ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= CHALLENGE ================= */
    if(cmd==='challenge'){
        const target = message.mentions.users.first();
        if(!target) return message.reply("❌ Mention a user to challenge");
        const targetUser = getUser(target.id);

        if(!user.dragon || !targetUser.dragon) return message.reply("❌ Both players must have selected a dragon");
        if(targetUser.currentChallenge) return message.reply("❌ Target already has a pending challenge");

        targetUser.currentChallenge = { from: userId };
        save();
        return message.reply(`⚔ ${message.author.username} challenged ${target.username}! Waiting for them to accept...`);
    }

    /* ================= ACCEPT ================= */
    if(cmd==='accept'){
        if(!user.currentChallenge) return message.reply("❌ No challenge to accept");

        const challengerId = user.currentChallenge.from;
        const challenger = getUser(challengerId);
        if(!challenger) return message.reply("❌ Challenger not found");

        delete user.currentChallenge;
        save();

        // Initialize battle
        let hpA = 100, hpB = 100;
        const dragonA = challenger.dragon;
        const dragonB = user.dragon;

        const battleMessage = await message.channel.send(`
⚔ **BATTLE START!**
${message.guild.members.cache.get(challengerId).user.username} (${dragons[dragonA].name}) ❤️ ${hpA} 
vs 
${message.author.username} (${dragons[dragonB].name}) ❤️ ${hpB}
        `);

        // Live HP update every 2 seconds
        const interval = setInterval(async () => {
            let dmgA = Math.floor(Math.random()*15)+5;
            let dmgB = Math.floor(Math.random()*15)+5;
            hpA -= dmgB;
            hpB -= dmgA;

            // Update battle board
            await battleMessage.edit(`
⚔ **BATTLE IN PROGRESS**
${message.guild.members.cache.get(challengerId).user.username} (${dragons[dragonA].name}) ❤️ ${hpA>0?hpA:0} 
vs 
${message.author.username} (${dragons[dragonB].name}) ❤️ ${hpB>0?hpB:0}
            `);

            // Check winner
            if(hpA<=0 || hpB<=0){
                clearInterval(interval);
                let winner, loser;
                if(hpA>hpB){ winner=challenger; loser=user; }
                else{ winner=user; loser=challenger; }

                winner.gems += 10;
                winner.wins +=1;
                loser.loses +=1;
                save();

                await battleMessage.edit(`
⚔ **BATTLE ENDED!**
🏆 Winner: ${message.guild.members.cache.get(winner===challenger?challengerId:userId).user.username} 
💎 Reward: 10 Gems
                `);
            }
        },2000);
    }
});
/* ================= MESSAGE HANDLER – ADMIN / OWNER / SHOP ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= SHOP ================= */
    if(cmd==='shop'){
        return message.reply(`
🛒 **SHOP**
🐉 Dragons: ${Object.keys(dragons).join(", ")}
⚔ Weapons: ${Object.keys(weapons).join(", ")}
🛡 Armours: ${Object.keys(armours).join(", ")}
Use s buy <item>
        `);
    }

    if(cmd==='buy'){
        const itemName = args.join(' ').toLowerCase();
        if(dragons[itemName]){
            // Example: Price based on dragon
            let price = 5000000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet-=price;
            user.inventory.dragons.push(itemName);
            save();
            return message.reply(`✅ Bought dragon ${dragons[itemName].name} for ${price} coins`);
        }
        else if(weapons[itemName]){
            let price = 2000000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet-=price;
            user.inventory.weapons.push(itemName);
            save();
            return message.reply(`✅ Bought weapon ${itemName} for ${price} coins`);
        }
        else if(armours[itemName]){
            let price = 2000000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet-=price;
            user.inventory.armours.push(itemName);
            save();
            return message.reply(`✅ Bought armour ${itemName} for ${price} coins`);
        } else return message.reply("❌ Item not found");
    }

    /* ================= OWNER COMMANDS ================= */
    if(userId !== OWNER_ID) return;

    if(cmd==='setmoney'){
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if(!target || !amount) return message.reply("❌ Usage: s setmoney @user <amount>");
        let tUser = getUser(target.id);
        tUser.wallet = amount; save();
        return message.reply(`✅ Set ${target.username}'s wallet to ${amount}`);
    }

    if(cmd==='setgems'){
        const target = message.mentions.users.first();
        const amount = parseInt(args[1]);
        if(!target || !amount) return message.reply("❌ Usage: s setgems @user <amount>");
        let tUser = getUser(target.id);
        tUser.gems = amount; save();
        return message.reply(`✅ Set ${target.username}'s gems to ${amount}`);
    }

    if(cmd==='admin'){
        const sub = args[0];
        const target = message.mentions.users.first();
        if(sub==='add'){ if(!target) return; if(!users[target.id].isAdmin) users[target.id].isAdmin=true; save(); return message.reply(`✅ Added ${target.username} as admin`);}
        if(sub==='remove'){ if(!target) return; if(users[target.id].isAdmin) delete users[target.id].isAdmin; save(); return message.reply(`✅ Removed ${target.username} from admin`);}
        if(sub==='list'){ let list = Object.keys(users).filter(u=>users[u].isAdmin).map(u=>u); return message.reply(`Admins: ${list.join(", ")}`);}
    }

    if(cmd==='resetall'){
        users={}; save();
        return message.reply("⚠ All data reset!");
    }
});

/* ================= LOGIN BOT ================= */
client.login(process.env.TOKEN);
