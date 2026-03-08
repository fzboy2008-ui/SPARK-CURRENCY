/* ================= IMPORTS ================= */
const { Client, GatewayIntentBits, EmbedBuilder, Collection } = require("discord.js");
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
const PREFIXES = ["s ","S ","spark ","Spark "];
const OWNER_ID = "1266728371719508062"; // fzboy786_01978

/* ================= DATABASE ================= */
if (!fs.existsSync("./database")) fs.mkdirSync("./database");
if (!fs.existsSync("./database/users.json")) fs.writeFileSync("./database/users.json", "{}");

let users = JSON.parse(fs.readFileSync("./database/users.json"));

function saveDB() {
    fs.writeFileSync("./database/users.json", JSON.stringify(users, null, 2));
}

function getUser(id){
    if(!users[id]){
        users[id] = {
            wallet:0,
            bank:0,
            gems:0,
            xp:0,
            rank:1,
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
            currentChallenge:null
        };
    }
    return users[id];
}

/* ================= DRAGONS / WEAPONS / ARMOURS ================= */
const dragons = {
    phoenix:{name:"Phoenix",emoji:"🔥",element:"Fire",basePower:60,maxLevel:250,abilities:[]},
    triton:{name:"Triton",emoji:"🌊",element:"Water",basePower:55,maxLevel:250,abilities:[]},
    rex:{name:"Rex",emoji:"⚡",element:"Lightning",basePower:70,maxLevel:250,abilities:[]},
    zephyr:{name:"Zephyr",emoji:"🌪️",element:"Wind",basePower:65,maxLevel:250,abilities:[]},
    grog:{name:"Grog",emoji:"🪨",element:"Earth",basePower:50,maxLevel:250,abilities:[]}
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
client.once("ready",()=>{
    console.log(`✅ Sparkle Empire Bot Online as ${client.user.tag}`);
});
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p=>message.content.startsWith(p));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const user = getUser(message.author.id);

    /* ================= BALANCE ================= */
    if(cmd==="bal" || cmd==="balance"){
        return message.reply(`
👨‍💼 **${message.author.username}**
💼 Wallet: ${user.wallet}
🏦 Bank: ${user.bank}
💎 Gems: ${user.gems}
        `);
    }

    /* ================= DAILY ================= */
    if(cmd==="daily"){
        const now = Date.now();
        const cooldown = 24*60*60*1000; // 24 hours
        if(now - user.lastDaily < cooldown){
            const remaining = cooldown - (now - user.lastDaily);
            const hours = Math.floor(remaining/3600000);
            const mins = Math.floor((remaining%3600000)/60000);
            return message.reply(`⏳ Already claimed daily! Wait ${hours}h ${mins}m`);
        }
        user.wallet += 1000; // Fixed daily reward
        user.lastDaily = now;
        saveDB();
        return message.reply(`🎁 Daily reward claimed: 1000 coins`);
    }

    /* ================= DEPOSIT ================= */
    if(cmd==="deposit"){
        let amount = args[0];
        if(!amount) return message.reply("❌ Enter amount to deposit or 'all'");
        if(amount.toLowerCase()==="all") amount = user.wallet;
        amount = parseInt(amount);
        if(isNaN(amount) || amount<=0) return message.reply("❌ Invalid amount");
        if(amount > user.wallet) return message.reply("❌ Not enough coins");

        user.wallet -= amount;
        user.bank += amount;
        saveDB();
        return message.reply(`🏦 Deposited ${amount} coins to bank`);
    }

    /* ================= WITHDRAW ================= */
    if(cmd==="withdraw"){
        let amount = args[0];
        if(!amount) return message.reply("❌ Enter amount to withdraw or 'all'");
        if(amount.toLowerCase()==="all") amount = user.bank;
        amount = parseInt(amount);
        if(isNaN(amount) || amount<=0) return message.reply("❌ Invalid amount");
        if(amount > user.bank) return message.reply("❌ Not enough coins");

        user.bank -= amount;
        user.wallet += amount;
        saveDB();
        return message.reply(`👛 Withdrawn ${amount} coins from bank`);
    }

    /* ================= GIVE COINS ================= */
    if(cmd==="give"){
        const target = message.mentions.users.first();
        let amount = parseInt(args[1]);
        if(!target) return message.reply("❌ Mention a user");
        if(isNaN(amount) || amount<=0) return message.reply("❌ Enter valid amount");
        if(amount > user.wallet) return message.reply("❌ Not enough coins");

        let tUser = getUser(target.id);
        user.wallet -= amount;
        tUser.wallet += amount;
        saveDB();
        return message.reply(`💸 Sent ${amount} coins to ${target.username}`);
    }
});
client.on("messageCreate", async message => {
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.startsWith(p));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const user = getUser(message.author.id);

    /* ================= COINFLIP ================= */
    if(cmd==="cf" || cmd==="coinflip"){
        let bet = args[0]?.toLowerCase() === "all" ? user.wallet : parseInt(args[0]);
        if(isNaN(bet) || bet <=0) return message.reply("❌ Enter valid bet amount");
        if(bet > 100000) bet = 100000;
        if(bet > user.wallet) bet = user.wallet;

        const choices = ["heads","tails"];
        const userChoice = args[1]?.toLowerCase();
        let choice = choices.includes(userChoice) ? userChoice : choices[Math.floor(Math.random()*2)];

        let msg = await message.channel.send("🎲 Coin flipping...");
        setTimeout(()=>{
            const result = choices[Math.floor(Math.random()*2)];
            if(result === choice){
                user.wallet += bet;
                msg.edit(`✅ Coin landed **${result}**! You won ${bet} coins`);
            } else {
                user.wallet -= bet;
                msg.edit(`❌ Coin landed **${result}**! You lost ${bet} coins`);
            }
            saveDB();
        },2000);
    }

    /* ================= SLOT MACHINE ================= */
    if(cmd==="slot"){
        let bet = args[0]?.toLowerCase() === "all" ? user.wallet : parseInt(args[0]);
        if(isNaN(bet) || bet<=0) return message.reply("❌ Enter valid bet amount");
        if(bet > 100000) bet = 100000;
        if(bet > user.wallet) bet = user.wallet;

        const symbols = ["💎","🥭","🍒","🍉"];
        let slotMsg = await message.channel.send("🎰 Spinning the slot...");

        // Animation simulation
        let frames = 5;
        let rolls = [];
        for(let i=0;i<frames;i++){
            rolls = [symbols[Math.floor(Math.random()*symbols.length)],
                     symbols[Math.floor(Math.random()*symbols.length)],
                     symbols[Math.floor(Math.random()*symbols.length)]];
            slotMsg.edit(`🎰 [${rolls.join(" ")}]`);
            await new Promise(r=>setTimeout(r,500));
        }

        // Determine outcome
        let payout = 0;
        if(rolls.every(s=>s===rolls[0])){
            if(rolls[0]==="💎") payout = bet*3;
            else if(rolls[0]==="🥭") payout = bet*2;
            else if(rolls[0]==="🍒") payout = bet*2;
            else if(rolls[0]==="🍉") payout = bet; // just return bet
        } else {
            payout = 0; // lose
        }

        if(payout>0){
            user.wallet += payout;
            slotMsg.edit(`🎰 [${rolls.join(" ")}]\n✅ You won ${payout} coins!`);
        } else {
            user.wallet -= bet;
            slotMsg.edit(`🎰 [${rolls.join(" ")}]\n❌ You lost ${bet} coins!`);
        }
        saveDB();
    }
});
client.on("messageCreate", async message=>{
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p => message.content.startsWith(p));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const user = getUser(message.author.id);

    /* ================= XP & RANK ================= */
    user.xp += 1; // 1 XP per message
    const xpPerRank = 2500;
    if(user.xp >= xpPerRank){
        user.xp -= xpPerRank;
        user.rank += 1;

        // Rank reward: coins + conditional gems
        user.wallet += 5000;
        let gemReward = 0;
        if([10,20,30,40,50].includes(user.rank)) {
            if(user.rank===10) gemReward=25;
            else if(user.rank===20) gemReward=50;
            else if(user.rank===30) gemReward=75;
            else if(user.rank===40) gemReward=100;
            else if(user.rank===50) gemReward=200;
            user.gems += gemReward;
        }

        message.channel.send(`
🏆 **RANK UP!**
${message.author.username} reached **Rank ${user.rank}**
💰 Coins: +5000
💎 Gems: +${gemReward}
        `);
    }

    /* ================= PROFILE ================= */
    if(cmd==="profile"){
        const avatar = message.author.displayAvatarURL({dynamic:true, size:64});
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username} Profile`)
            .setThumbnail(avatar)
            .addFields(
                {name:"Rank", value:`${user.rank}`,inline:true},
                {name:"XP", value:`${user.xp}/${xpPerRank}`,inline:true},
                {name:"Wallet", value:`${user.wallet}`,inline:true},
                {name:"Bank", value:`${user.bank}`,inline:true},
                {name:"Gems", value:`${user.gems}`,inline:true},
                {name:"Dragon", value:user.dragon? `${dragons[user.dragon].emoji} ${dragons[user.dragon].name}`:"None",inline:true},
                {name:"Weapon", value:user.weapon||"None",inline:true},
                {name:"Armour", value:user.armour||"None",inline:true}
            )
            .setColor("#00ffff");

        return message.reply({embeds:[embed]});
    }

    /* ================= INVENTORY ================= */
    if(cmd==="inv" || cmd==="inventory"){
        return message.reply(`
👤 ${message.author.username} Inventory

🐉 DRAGONS:
${user.inventory.dragons.length ? user.inventory.dragons.map(d=>`${dragons[d].emoji} ${dragons[d].name}`).join("\n") : "None"}

🛡 ARMOURS:
${user.inventory.armours.length ? user.inventory.armours.join("\n") : "None"}

🗡 WEAPONS:
${user.inventory.weapons.length ? user.inventory.weapons.join("\n") : "None"}
        `);
    }

    /* ================= SET COMMAND ================= */
    if(cmd==="set"){
        const category = args[0]?.toLowerCase();
        const name = args.slice(1).join(" ").toLowerCase();
        if(!category || !name) return message.reply("❌ Usage: s set <dragon/weapon/armour> <name>");

        if(category==="dragon"){
            if(!user.inventory.dragons.includes(name)) return message.reply("❌ You don't own this dragon");
            user.dragon = name;
            saveDB();
            return message.reply(`✅ Selected dragon: ${dragons[name].emoji} ${dragons[name].name}`);
        }
        if(category==="weapon"){
            if(!user.inventory.weapons.includes(name)) return message.reply("❌ You don't own this weapon");
            user.weapon = name;
            saveDB();
            return message.reply(`✅ Selected weapon: ${name}`);
        }
        if(category==="armour"){
            if(!user.inventory.armours.includes(name)) return message.reply("❌ You don't own this armour");
            user.armour = name;
            saveDB();
            return message.reply(`✅ Selected armour: ${name}`);
        }
        return message.reply("❌ Invalid category");
    }
});
client.on("messageCreate", async message=>{
    if(message.author.bot) return;

    const prefixUsed = PREFIXES.find(p=>message.content.startsWith(p));
    if(!prefixUsed) return;

    const args = message.content.slice(prefixUsed.length).trim().split(/ +/);
    const cmd = args.shift()?.toLowerCase();
    const user = getUser(message.author.id);

    /* ================= SHOP ================= */
    if(cmd==="shop"){
        return message.channel.send(`
🛒 **SHOP CATEGORIES**

🐉 DRAGONS: ${Object.keys(dragons).join(", ")}
🛡 ARMOURS: ${Object.keys(armours).join(", ")}
🗡 WEAPONS: ${Object.keys(weapons).join(", ")}

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
            const price = 5000000 + dragons[name].basePower*100000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet -= price;
            user.inventory.dragons.push(name);
            saveDB();
            return message.reply(`✅ Bought dragon: ${dragons[name].emoji} ${dragons[name].name} for ${price} coins`);
        }

        if(category==="weapon"){
            if(!weapons[name]) return message.reply("❌ Weapon not found");
            if(user.inventory.weapons.includes(name)) return message.reply("❌ You already own this weapon");
            const price = 1000000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet -= price;
            user.inventory.weapons.push(name);
            saveDB();
            return message.reply(`✅ Bought weapon: ${name} for ${price} coins`);
        }

        if(category==="armour"){
            if(!armours[name]) return message.reply("❌ Armour not found");
            if(user.inventory.armours.includes(name)) return message.reply("❌ You already own this armour");
            const price = 1000000;
            if(user.wallet<price) return message.reply("❌ Not enough coins");
            user.wallet -= price;
            user.inventory.armours.push(name);
            saveDB();
            return message.reply(`✅ Bought armour: ${name} for ${price} coins`);
        }

        return message.reply("❌ Invalid category");
    }

    /* ================= BATTLE CHALLENGE ================= */
    if(cmd==="challenge"){
        const target = message.mentions.users.first();
        if(!target) return message.reply("❌ Mention a user to challenge");
        const tUser = getUser(target.id);
        if(!user.dragon) return message.reply("❌ Select a dragon first");
        if(!tUser.dragon) return message.reply("❌ Target must select a dragon");

        user.currentChallenge = {target: target.id};
        tUser.currentChallenge = {from: message.author.id};
        return message.channel.send(`${target}, challenged by ${message.author}. Type \`s accept\` to start!`);
    }

    if(cmd==="accept"){
        if(!user.currentChallenge?.from) return message.reply("❌ No challenge to accept");
        const challenger = client.users.cache.get(user.currentChallenge.from);
        const cUser = getUser(challenger.id);

        // Calculate powers
        let uDragon = dragons[user.dragon];
        let cDragon = dragons[cUser.dragon];
        let uPower = uDragon.basePower + (user.rank*0.05*uDragon.basePower) + (weapons[user.weapon]?.attack||0);
        let cPower = cDragon.basePower + (cUser.rank*0.05*cDragon.basePower) + (weapons[cUser.weapon]?.attack||0);

        let uDef = armours[user.armour]?.defense||0;
        let cDef = armours[cUser.armour]?.defense||0;

        let uHP = uPower + uDef;
        let cHP = cPower + cDef;

        let battleMsg = await message.channel.send(`
⚔️ **BATTLE ARENA**
${message.author.username} VS ${challenger.username}

❤️ ${uHP}   VS   ${cHP}
Battle in progress...
        `);

        let totalPower = uPower + cPower;
        let winner, loser;
        if(Math.random()*totalPower <= uPower){
            winner = user;
            loser = cUser;
        } else {
            winner = cUser;
            loser = user;
        }

        winner.wins += 1;
        loser.loses += 1;
        winner.gems += 25; // battle win reward
        loser.gems -= 5;   // lose penalty

        user.currentChallenge = null;
        cUser.currentChallenge = null;

        saveDB();

        setTimeout(()=>{
            battleMsg.edit(`🎉 Battle finished! Winner: ${client.users.cache.get(Object.keys(users).find(id=>users[id]===winner)).username}`);
        },2000);
    }

    /* ================= LEADERBOARDS ================= */
    if(cmd==="lb" || cmd==="leaderboard"){
        const type = args[0]?.toLowerCase();

        if(type==="balance" || type==="b"){
            const sorted = Object.entries(users).sort((a,b)=> (b[1].wallet+b[1].bank) - (a[1].wallet+a[1].bank));
            let lb = "**💰 BALANCE LEADERBOARD**\n";
            sorted.slice(0,10).forEach(([id,u],i)=>{
                const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
                lb += `${medal}${i+1}. <@${id}> - Wallet:${u.wallet} Bank:${u.bank} Gems:${u.gems}\n`;
            });
            return message.channel.send(lb);
        }

        if(type==="battles" || type==="bat"){
            const sorted = Object.entries(users).sort((a,b)=>b[1].wins - a[1].wins);
            let lb = "**⚔️ BATTLE LEADERBOARD**\n";
            sorted.slice(0,10).forEach(([id,u],i)=>{
                const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
                lb += `${medal}${i+1}. <@${id}> - Wins:${u.wins} Loses:${u.loses}\n`;
            });
            return message.channel.send(lb);
        }
    }

    /* ================= ADMIN / OWNER ================= */
    if(cmd==="disable" && message.member.permissions.has("Administrator")){
        user.disabledChannel = true;
        return message.reply("✅ Bot disabled in this channel");
    }
    if(cmd==="enable" && message.member.permissions.has("Administrator")){
        user.disabledChannel = false;
        return message.reply("✅ Bot enabled in this channel");
    }

    if(message.author.id===OWNER_ID){
        if(cmd==="setmoney"){
            const target = message.mentions.users.first();
            let amount = parseInt(args[1]);
            if(!target || isNaN(amount)) return message.reply("❌ Usage: s setmoney @user amount");
            const tUser = getUser(target.id);
            tUser.wallet = amount;
            saveDB();
            return message.reply(`✅ Set ${target.username}'s coins to ${amount}`);
        }

        if(cmd==="setgems"){
            const target = message.mentions.users.first();
            let amount = parseInt(args[1]);
            if(!target || isNaN(amount)) return message.reply("❌ Usage: s setgems @user amount");
            const tUser = getUser(target.id);
            tUser.gems = amount;
            saveDB();
            return message.reply(`✅ Set ${target.username}'s gems to ${amount}`);
        }
    }
});
/* ================= HELP COMMAND ================= */
if(cmd === "help"){
    const embed = new EmbedBuilder()
        .setTitle("🆘 SPARK BOT - COMMANDS")
        .setDescription(`
💻 **User Commands**
• s daily         - Claim your daily reward
• s bal / balance - Show wallet, bank & gems
• s cf / coinflip <amount> [heads/tails] - Flip a coin
• s slot <amount> - Play slot machine
• s rank          - Show your rank and XP progress
• s profile       - Show your profile (dragon, weapon, armour)
• s shop          - View shop categories
• s buy <category> <name> - Buy dragon, weapon or armour
• s inv / inventory - Show your inventory
• s deposit <amount/all>  - Deposit coins to bank
• s withdraw <amount/all> - Withdraw coins from bank
• s challenge @user       - Challenge another user to battle
• s accept                - Accept a battle challenge
• s lb balance / b        - Leaderboard by coins/gems
• s lb battles / bat      - Leaderboard by battle wins

⚙️ **Admin Commands**
• s disable - Disable bot in current channel (Admin only)
• s enable  - Enable bot in current channel (Admin only)

👑 **Owner Commands**
• s setmoney @user <amount> - Set coins for a user
• s setgems @user <amount>   - Set gems for a user
        `)
        .setColor("#00ffff");
    return message.reply({embeds: [embed]});
}

/* ================= BOT LOGIN ================= */
client.login(process.env.TOKEN);
