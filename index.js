/* ================= IMPORTS ================= */
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
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

/* ================= PREFIXES & OWNER ================= */
const PREFIXES = ["s ", "S ", "spark ", "Spark "];
const OWNER_ID = "1266728371719508062"; // fzboy786_01978

/* ================= DATABASE ================= */
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json", "{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function save() {
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
            inventory:{
                dragons:[],
                weapons:[],
                armours:[]
            },
            lastDaily:0,
            wins:0,
            loses:0,
            isAdmin:false,
            currentChallenge:null
        };
    }
    return users[id];
}

/* ================= DRAGONS / WEAPONS / ARMOURS ================= */
const dragons = {
    grog: {name:"Grog", emoji:"🪨", element:"Earth", basePower:50},
    phoenix: {name:"Phoenix", emoji:"🔥", element:"Fire", basePower:60},
    triton: {name:"Triton", emoji:"🌊", element:"Water", basePower:55},
    rex: {name:"Rex", emoji:"⚡", element:"Lightning", basePower:70},
    zephyr: {name:"Zephyr", emoji:"🌪️", element:"Wind", basePower:65}
};

const weapons = {
    "flame sword": {attack:15},
    "thunder blade": {attack:20},
    "aqua spear": {attack:17},
    "stone hammer": {attack:22},
    "wind dagger": {attack:12}
};

const armours = {
    "dragon plate": {defense:15},
    "thunder guard": {defense:20},
    "aqua shield": {defense:17},
    "earth armor": {defense:22},
    "zephyr cloak": {defense:12}
};

/* ================= BOT READY ================= */
client.once("ready", () => {
    console.log(`⚡ Spark Bot Online as ${client.user.tag}`);
});

/* ================= XP & RANK SYSTEM ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    let user = getUser(message.author.id);

    // 1 XP per message
    user.xp += 1;
    let neededXP = 2500; // XP per rank

    if(user.xp >= neededXP){
        user.xp -= neededXP;
        user.rank += 1;

        // Rank-up reward
        user.wallet += 5000;
        user.gems += 5;

        message.channel.send(`
🏆 **RANK UP!**
${message.author.username} reached **Rank ${user.rank}**
💰 Coins: +5000
💎 Gems: +5
        `);
    }

    save();
});
/* ================= ECONOMY COMMANDS ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= BALANCE ================= */
    if(cmd === "bal" || cmd === "balance"){
        return message.reply(`
👨‍💼 **${message.author.username}**
💼 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
        `);
    }

    /* ================= DAILY ================= */
    if(cmd === "d" || cmd === "daily"){
        const now = Date.now();
        const cooldown = 24*60*60*1000; // 24 hours
        if(now - user.lastDaily < cooldown){
            const remaining = cooldown - (now - user.lastDaily);
            const hours = Math.floor(remaining/3600000);
            const mins = Math.floor((remaining%3600000)/60000);
            return message.reply(`⏳ You already claimed daily! Wait ${hours}h ${mins}m`);
        }
        user.wallet += 500; // daily reward
        user.lastDaily = now;
        save();
        return message.reply(`🎁 Daily reward claimed: 500 coins`);
    }

    /* ================= DEPOSIT ================= */
    if(cmd === "d" || cmd === "deposit"){
        let amount = args[0];
        if(!amount) return message.reply("❌ Enter amount to deposit or 'all'");
        if(amount.toLowerCase()==="all") amount = user.wallet;
        amount = parseInt(amount);
        if(isNaN(amount) || amount <=0) return message.reply("❌ Invalid amount");
        if(amount > user.wallet) return message.reply("❌ Not enough wallet coins");

        user.wallet -= amount;
        user.bank += amount;
        save();
        return message.reply(`🏦 Deposited ${amount} coins to bank`);
    }

    /* ================= WITHDRAW ================= */
    if(cmd === "w" || cmd === "withdraw"){
        let amount = args[0];
        if(!amount) return message.reply("❌ Enter amount to withdraw or 'all'");
        if(amount.toLowerCase()==="all") amount = user.bank;
        amount = parseInt(amount);
        if(isNaN(amount) || amount <=0) return message.reply("❌ Invalid amount");
        if(amount > user.bank) return message.reply("❌ Not enough bank coins");

        user.bank -= amount;
        user.wallet += amount;
        save();
        return message.reply(`👛 Withdrawn ${amount} coins from bank`);
    }

    /* ================= GIVE ================= */
    if(cmd === "g" || cmd === "give"){
        const target = message.mentions.users.first();
        let amount = parseInt(args[1]);
        if(!target) return message.reply("❌ Mention a user to give coins");
        if(isNaN(amount) || amount <=0) return message.reply("❌ Enter valid amount");
        if(amount > user.wallet) return message.reply("❌ Not enough coins");

        let tUser = getUser(target.id);
        user.wallet -= amount;
        tUser.wallet += amount;
        save();
        return message.reply(`💸 Sent ${amount} coins to ${target.username}`);
    }
});
/* ================= GAMES + SELECT + PROFILE ================= */
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const userId = message.author.id;
    let user = getUser(userId);

    /* ================= COINFLIP ================= */
    if(cmd === "cf" || cmd === "coinflip"){
        let bet = parseInt(args[0]);
        if(isNaN(bet) || bet <=0) return message.reply("❌ Enter valid bet amount");
        if(bet > user.wallet) bet = user.wallet;
        if(bet > 100000) bet = 100000;

        let outcomes = ["heads","tails"];
        let choice = args[1]?.toLowerCase();
        if(!choice || !outcomes.includes(choice)) choice = outcomes[Math.floor(Math.random()*2)];

        // Simulate rolling animation
        let msgRoll = await message.channel.send("🎲 Coin is flipping...");
        setTimeout(()=>{
            let result = outcomes[Math.floor(Math.random()*2)];
            if(result === choice){
                user.wallet += bet;
                msgRoll.edit(`✅ Coin landed **${result}**! You won ${bet} coins`);
            } else {
                user.wallet -= bet;
                msgRoll.edit(`❌ Coin landed **${result}**! You lost ${bet} coins`);
            }
            save();
        },2000);
    }

    /* ================= SLOT MACHINE ================= */
    if(cmd === "s" || cmd === "slot"){
        let bet = parseInt(args[0]);
        if(isNaN(bet) || bet <=0) return message.reply("❌ Enter valid bet amount");
        if(bet > user.wallet) bet = user.wallet;
        if(bet > 100000) bet = 100000;

        const symbols = ["💎","🍉","🥭"];
        let msgSlot = await message.channel.send("🎰 Spinning slot...");
        setTimeout(()=>{
            let roll = [symbols[Math.floor(Math.random()*3)],symbols[Math.floor(Math.random()*3)],symbols[Math.floor(Math.random()*3)]];
            let payout = 0;
            if(roll.every(s=>s===roll[0])){
                if(roll[0]==="💎") payout = bet*3;
                else if(roll[0]==="🥭") payout = bet*2;
                else if(roll[0]==="🍉") payout = bet;
            }
            if(payout>0){
                user.wallet += payout;
                msgSlot.edit(`🎰 [${roll.join(" ")}]\n✅ You won ${payout} coins!`);
            } else {
                user.wallet -= bet;
                msgSlot.edit(`🎰 [${roll.join(" ")}]\n❌ You lost ${bet} coins!`);
            }
            save();
        },2000);
    }

    /* ================= SELECT DRAGON / WEAPON / ARMOUR ================= */
    if(cmd === "set"){
        const category = args[0]?.toLowerCase();
        const name = args.slice(1).join(" ").toLowerCase();
        if(!category || !name) return message.reply("❌ Usage: s set <dragon/weapon/armour> <name>");

        if(category==="dragon"){
            if(!user.inventory.dragons.includes(name)) return message.reply("❌ You don't own this dragon");
            user.dragon = name;
            save();
            return message.reply(`✅ Selected dragon: ${dragons[name].emoji} ${dragons[name].name}`);
        }
        if(category==="weapon"){
            if(!user.inventory.weapons.includes(name)) return message.reply("❌ You don't own this weapon");
            user.weapon = name;
            save();
            return message.reply(`✅ Selected weapon: ${name}`);
        }
        if(category==="armour"){
            if(!user.inventory.armours.includes(name)) return message.reply("❌ You don't own this armour");
            user.armour = name;
            save();
            return message.reply(`✅ Selected armour: ${name}`);
        }
        return message.reply("❌ Invalid category");
    }

    /* ================= PROFILE ================= */
    if(cmd === "profile"){
        const avatar = message.author.displayAvatarURL({dynamic:true, size:64});
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username} Profile`)
            .setThumbnail(avatar)
            .addFields(
                {name:"Rank", value: `${user.rank}`, inline:true},
                {name:"XP", value: `${user.xp}/2500`, inline:true},
                {name:"Wallet", value: `${user.wallet}`, inline:true},
                {name:"Bank", value: `${user.bank}`, inline:true},
                {name:"Gems", value: `${user.gems}`, inline:true},
                {name:"Dragon", value: user.dragon? `${dragons[user.dragon].emoji} ${dragons[user.dragon].name}`:"None", inline:true},
                {name:"Weapon", value: user.weapon || "None", inline:true},
                {name:"Armour", value: user.armour || "None", inline:true}
            )
            .setColor("#00ffff");

        return message.reply({embeds:[embed]});
    }

    /* ================= INVENTORY ================= */
    if(cmd === "inv" || cmd === "inventory"){
        return message.reply(`
👤 ${message.author.username} Inventory

🐉 DRAGONS:
${user.inventory.dragons.length?user.inventory.dragons.map(d=>`${dragons[d].emoji} ${dragons[d].name}`).join("\n"):"None"}

🛡 ARMOURS:
${user.inventory.armours.length?user.inventory.armours.join("\n"):"None"}

🗡 WEAPONS:
${user.inventory.weapons.length?user.inventory.weapons.join("\n"):"None"}
        `);
    }

});
/* ================= BATTLE SYSTEM ================= */
client.on("messageCreate", async message=>{
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p=>message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const user = getUser(message.author.id);

    /* ================= CHALLENGE ================= */
    if(cmd==="challenge"){
        const target = message.mentions.users.first();
        if(!target) return message.reply("❌ Mention a user to challenge");
        const tUser = getUser(target.id);

        if(!user.dragon) return message.reply("❌ You must select a dragon");
        if(!tUser.dragon) return message.reply("❌ Target must have a dragon selected");

        user.currentChallenge = {target: target.id};
        tUser.currentChallenge = {from: message.author.id};

        return message.channel.send(`${target}, you have been challenged by ${message.author}. Type \`s accept\` to start battle!`);
    }

    /* ================= ACCEPT ================= */
    if(cmd==="accept"){
        if(!user.currentChallenge?.from) return message.reply("❌ No challenge to accept");
        const challenger = client.users.cache.get(user.currentChallenge.from);
        const cUser = getUser(challenger.id);

        // Battle calculations
        let userDragon = dragons[user.dragon];
        let cDragon = dragons[cUser.dragon];

        let userPower = userDragon.basePower + (user.rank*0.05*userDragon.basePower);
        let cPower = cDragon.basePower + (cUser.rank*0.05*cDragon.basePower);

        if(user.weapon) userPower += weapons[user.weapon]?.attack||0;
        if(cUser.weapon) cPower += weapons[cUser.weapon]?.attack||0;

        let userDef = armours[user.armour]?.defense||0;
        let cDef = armours[cUser.armour]?.defense||0;

        let userHP = userPower + userDef;
        let cHP = cPower + cDef;

        // Live HP bars simulation (simplified)
        let battleMsg = await message.channel.send(`
╔━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╗
      ⚔️ BATTLE ARENA ⚔️
╠━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╣
  ACCEPTOR               ║  CHALLENGER
   ${message.author.username}        ║  ${challenger.username}
╠━━━━━━━━━━━━━━╬━━━━━━━━━━━━━━╣
 ${userDragon.emoji} ${user.dragon.toUpperCase()}       ║  ${cDragon.emoji} ${cUser.dragon.toUpperCase()}
 ⭐ LVL ${user.rank}                  ║  ⭐ LVL ${cUser.rank}
 🛡️ ${userDragon.element}                 ║  ☄️ ${cDragon.element}
╠━━━━━━━━━━━━━━╬━━━━━━━━━━━━━━╣
        ❤️ [■■■■■□]  ║  ❤️ [■■■■□□]
                        ${userHP}       ║     ${cHP}
╠━━━━━━━━━━━━━━╬━━━━━━━━━━━━━━╣
 📢 STATUS: BATTLE IN PROGRESS
╚━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╝
        `);

        // Decide winner randomly based on power ratio
        let total = userPower+cPower;
        let chance = Math.random()*total;
        let winner, loser;
        if(chance <= userPower){
            winner = user;
            loser = cUser;
        } else {
            winner = cUser;
            loser = user;
        }

        // Update wins/loses + reward
        winner.wins +=1;
        loser.loses +=1;
        winner.gems += 10;

        save();
        setTimeout(()=>{
            battleMsg.edit(`🎉 Battle finished! Winner: ${client.users.cache.get(Object.keys(users).find(id=>users[id]===winner)).username}`);
        },3000);

        user.currentChallenge = null;
        cUser.currentChallenge = null;
    }

    /* ================= LEADERBOARDS ================= */
    if(cmd==="lb" || cmd==="leaderboard"){
        const type = args[0]?.toLowerCase();
        if(type==="balance" || type==="b"){
            const sorted = Object.entries(users).sort((a,b)=>b[1].wallet+a[1].bank - (a[1].wallet+b[1].bank));
            let lbMsg = "**💰 BALANCE LEADERBOARD**\n";
            sorted.slice(0,10).forEach(([id,u],i)=>{
                lbMsg += `${i+1}. <@${id}> - Wallet:${u.wallet} Bank:${u.bank} Gems:${u.gems}\n`;
            });
            return message.channel.send(lbMsg);
        }
        if(type==="battles" || type==="bat"){
            const sorted = Object.entries(users).sort((a,b)=>b[1].wins - a[1].wins);
            let lbMsg = "**⚔️ BATTLE LEADERBOARD**\n";
            sorted.slice(0,10).forEach(([id,u],i)=>{
                lbMsg += `${i+1}. <@${id}> - Wins:${u.wins} Loses:${u.loses}\n`;
            });
            return message.channel.send(lbMsg);
        }
    }

    /* ================= SHOP ================= */
    if(cmd==="shop"){
        return message.channel.send(`
🛒 **SHOP CATEGORIES**

🐉 DRAGONS:
${Object.keys(dragons).join(", ")}

🛡 ARMOURS:
${Object.keys(armours).join(", ")}

🗡 WEAPONS:
${Object.keys(weapons).join(", ")}

Buy with: s buy <category> <name>
        `);
    }

    /* ================= BUY ================= */
    if(cmd==="buy"){
        const category = args[0]?.toLowerCase();
        const name = args.slice(1).join(" ").toLowerCase();
        if(!category || !name) return message.reply("❌ Usage: s buy <category> <name>");
        if(category==="dragon"){
            if(!dragons[name]) return message.reply("❌ Dragon not found");
            if(user.inventory.dragons.includes(name)) return message.reply("❌ You already own this dragon");
            let price = 5000000 + dragons[name].basePower*100000; // example dynamic price
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet -= price;
            user.inventory.dragons.push(name);
            save();
            return message.reply(`✅ You bought dragon: ${dragons[name].emoji} ${dragons[name].name} for ${price} coins`);
        }
        if(category==="weapon"){
            if(!weapons[name]) return message.reply("❌ Weapon not found");
            if(user.inventory.weapons.includes(name)) return message.reply("❌ You already own this weapon");
            let price = 3000000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet -= price;
            user.inventory.weapons.push(name);
            save();
            return message.reply(`✅ You bought weapon: ${name} for ${price} coins`);
        }
        if(category==="armour"){
            if(!armours[name]) return message.reply("❌ Armour not found");
            if(user.inventory.armours.includes(name)) return message.reply("❌ You already own this armour");
            let price = 3000000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet -= price;
            user.inventory.armours.push(name);
            save();
            return message.reply(`✅ You bought armour: ${name} for ${price} coins`);
        }
        return message.reply("❌ Invalid category");
    }

});
/* ================= ADMIN & OWNER COMMANDS ================= */
client.on("messageCreate", async message=>{
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p=>message.content.toLowerCase().startsWith(p.toLowerCase()));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const user = getUser(message.author.id);

    /* ================= SERVER ADMIN ENABLE/DISABLE ================= */
    if(cmd==="disable"){
        if(!message.member.permissions.has("Administrator")) return message.reply("❌ Admin only");
        const channel = message.channel.id;
        user.disabledChannel = true;
        return message.reply("✅ Bot disabled in this channel");
    }
    if(cmd==="enable"){
        if(!message.member.permissions.has("Administrator")) return message.reply("❌ Admin only");
        user.disabledChannel = false;
        return message.reply("✅ Bot enabled in this channel");
    }

    /* ================= BOT OWNER ONLY ================= */
    if(message.author.id!==OWNER_ID) return;

    if(cmd==="setmoney"){
        const target = message.mentions.users.first();
        let amount = parseInt(args[1]);
        if(!target || isNaN(amount)) return message.reply("❌ Usage: s 
