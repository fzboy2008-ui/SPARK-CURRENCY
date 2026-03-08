const { Client, GatewayIntentBits, MessageEmbed } = require("discord.js");
const fs = require("fs");

const prefix = "s";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// ================= DATABASE =================
let data = {};
let disabledChannels = [];

if(fs.existsSync("./data.json")){
    data = JSON.parse(fs.readFileSync("./data.json"));
}

function saveData(){
    fs.writeFileSync("./data.json", JSON.stringify(data,null,2));
}

// ================= USER CREATION =================
function createUser(id){
    if(!data[id]){
        data[id] = {
            xp:0,
            rank:1,
            coins:0,
            gems:0,
            bank:0,
            dragon:null,
            weapon:null,
            armour:null,
            dragons:[],
            weapons:[],
            armours:[],
            battles:0,
            dailyClaimed:false,
            dailyTimeout:0,
            dragonsLevel:{},
            abilitiesUnlocked:{}
        };
    }
}

// ================= BOT READY =================
client.once("ready",()=>{
    console.log(`Bot Online: ${client.user.tag}`);
});
// ================= DAILY REWARD =================
client.on("messageCreate", async message => {
    if(message.author.bot) return;
    const userId = message.author.id;
    createUser(userId);

    if(message.content.toLowerCase() === `${prefix}daily`){
        const now = Date.now();
        if(data[userId].dailyTimeout && now - data[userId].dailyTimeout < 24*60*60*1000){
            const remaining = 24*60*60*1000 - (now - data[userId].dailyTimeout);
            const hrs = Math.floor(remaining/3600000);
            const mins = Math.floor((remaining%3600000)/60000);
            const secs = Math.floor((remaining%60000)/1000);
            return message.reply(`⏳ Already claimed daily reward. Try again in ${hrs}h ${mins}m ${secs}s`);
        }
        // Fixed daily reward 1000 coins
        data[userId].coins += 1000;
        data[userId].dailyTimeout = now;
        saveData();
        return message.reply(`🎉 You claimed your daily reward: 1000 🪙 coins!`);
    }
});

// ================= BALANCE COMMAND =================
client.on("messageCreate", async message => {
    if(message.author.bot) return;
    const userId = message.author.id;
    createUser(userId);

    if(message.content.toLowerCase() === `${prefix}bal` || message.content.toLowerCase() === `${prefix}balance`){
        const u = data[userId];
        const balEmbed = new MessageEmbed()
        .setTitle(`👤 ${message.author.username} | Balance`)
        .setColor("BLUE")
        .setThumbnail(message.author.displayAvatarURL({dynamic:true}))
        .addFields(
            {name: "💼 Wallet", value: `${u.coins} 🪙`, inline:true},
            {name: "🏦 Bank", value: `${u.bank} 🪙`, inline:true},
            {name: "💎 Gems", value: `${u.gems}`, inline:true}
        );
        message.reply({embeds:[balEmbed]});
    }
});

// ================= BANK SYSTEM =================
client.on("messageCreate", async message => {
    if(message.author.bot) return;
    const userId = message.author.id;
    createUser(userId);

    const msg = message.content.toLowerCase();
    if(msg.startsWith(`${prefix}deposit`)){
        const args = message.content.split(" ");
        const amount = parseInt(args[1]);
        if(!amount || amount <=0) return message.reply("Enter valid amount to deposit");
        if(amount > data[userId].coins) return message.reply("Not enough coins in wallet");
        data[userId].coins -= amount;
        data[userId].bank += amount;
        saveData();
        return message.reply(`🏦 Deposited ${amount} coins to bank`);
    }

    if(msg.startsWith(`${prefix}withdraw`)){
        const args = message.content.split(" ");
        const amount = parseInt(args[1]);
        if(!amount || amount <=0) return message.reply("Enter valid amount to withdraw");
        if(amount > data[userId].bank) return message.reply("Not enough coins in bank");
        data[userId].bank -= amount;
        data[userId].coins += amount;
        saveData();
        return message.reply(`💼 Withdrawn ${amount} coins to wallet`);
    }
});
// ================= PROFILE COMMAND =================
client.on("messageCreate", async message => {
    if(message.author.bot) return;
    const userId = message.author.id;
    createUser(userId);

    if(message.content.toLowerCase() === `${prefix}profile`){
        const u = data[userId];

        const profileEmbed = new MessageEmbed()
        .setTitle(`👤 ${message.author.username} | Profile`)
        .setColor("GOLD")
        .setThumbnail(message.author.displayAvatarURL({dynamic:true}))
        .addFields(
            {name: "Rank", value: `${u.rank}`, inline:true},
            {name: "XP", value: `${u.xp} XP`, inline:true},
            {name: "Wallet", value: `${u.coins} 🪙`, inline:true},
            {name: "Bank", value: `${u.bank} 🪙`, inline:true},
            {name: "Gems", value: `${u.gems}`, inline:true},
            {name: "Selected Dragon", value: `${u.dragon ? u.dragon : "None"}`, inline:true},
            {name: "Selected Weapon", value: `${u.weapon ? u.weapon : "None"}`, inline:true},
            {name: "Selected Armour", value: `${u.armour ? u.armour : "None"}`, inline:true}
        );

        message.reply({embeds:[profileEmbed]});
    }

    // ================= INVENTORY COMMAND =================
    if(message.content.toLowerCase() === `${prefix}inv` || message.content.toLowerCase() === `${prefix}inventory`){
        const u = data[userId];

        const invEmbed = new MessageEmbed()
        .setTitle(`🎒 ${message.author.username} | Inventory`)
        .setColor("GREEN")
        .addFields(
            {name:"🐉 Dragons", value: u.dragons.length > 0 ? u.dragons.join(", ") : "None", inline:false},
            {name:"⚔ Weapons", value: u.weapons.length > 0 ? u.weapons.join(", ") : "None", inline:false},
            {name:"🛡 Armour", value: u.armours.length > 0 ? u.armours.join(", ") : "None", inline:false}
        );

        message.reply({embeds:[invEmbed]});
    }

    // ================= SHOP COMMAND =================
    if(message.content.toLowerCase() === `${prefix}shop`){
        const shopEmbed = new MessageEmbed()
        .setTitle(`🛒 Sparkle Empire Shop`)
        .setColor("ORANGE")
        .setDescription(`
**Dragons** (5m - 10m coins)
🔥 Phoenix
🌊 Triton
⚡ Rex
🍃 Zephyr
🪨 Grog

**Weapons** (1m - 5m coins)
🔥 Flame Sword
🌊 Aqua Spear
⚡ Thunder Blade

**Armour** (1m - 5m coins)
🔥 Fire Shield
🌊 Aqua Armour
⚡ Lightning Armour

Use \`${prefix}buy <category> <item>\` to purchase
        `);

        message.reply({embeds:[shopEmbed]});
    }

    // ================= BUY COMMAND =================
    if(message.content.toLowerCase().startsWith(`${prefix}buy`)){
        const args = message.content.split(" ");
        const category = args[1]?.toLowerCase();
        const item = args.slice(2).join(" ");

        if(!category || !item) return message.reply("Usage: s buy <category> <item>");
        const u = data[userId];

        if(category === "dragon"){
            if(u.dragons.includes(item)) return message.reply("You already own this dragon!");
            u.dragons.push(item);
            u.dragon = item; // auto select purchased dragon
        } else if(category === "weapon"){
            if(u.weapons.includes(item)) return message.reply("You already own this weapon!");
            u.weapons.push(item);
            u.weapon = item;
        } else if(category === "armour"){
            if(u.armours.includes(item)) return message.reply("You already own this armour!");
            u.armour = item;
            u.armours.push(item);
        } else {
            return message.reply("Invalid category! Choose dragon, weapon, or armour.");
        }

        saveData();
        message.reply(`✅ Purchased **${item}** in category **${category}**`);
    }

    // ================= SELECT COMMAND =================
    if(message.content.toLowerCase().startsWith(`${prefix}set`)){
        const args = message.content.split(" ");
        const category = args[1]?.toLowerCase();
        const item = args.slice(2).join(" ");
        const u = data[userId];

        if(category === "dragon"){
            if(!u.dragons.includes(item)) return message.reply("You don't own this dragon!");
            u.dragon = item;
        } else if(category === "weapon"){
            if(!u.weapons.includes(item)) return message.reply("You don't own this weapon!");
            u.weapon = item;
        } else if(category === "armour"){
            if(!u.armours.includes(item)) return message.reply("You don't own this armour!");
            u.armour = item;
        } else return message.reply("Invalid category! Choose dragon, weapon, or armour.");

        saveData();
        message.reply(`✅ Selected **${item}** for **${category}**`);
    }
});
// ================= COINFLIP =================
client.on("messageCreate", async message=>{
    if(message.author.bot) return;
    const args = message.content.split(" ");
    const cmd = args[0].toLowerCase();
    createUser(message.author.id);
    const u = data[message.author.id];

    if(cmd === `${prefix}cf`){
        let bet = args[1];
        if(!bet) return message.reply("Enter bet amount or 'all'");
        if(bet.toLowerCase() === "all") bet = Math.min(u.coins,100000);
        else bet = parseInt(bet);
        if(isNaN(bet) || bet <= 0) return message.reply("Enter valid amount");
        if(bet > 100000) bet = 100000;
        if(bet > u.coins) return message.reply("Not enough coins");

        let win = Math.random() < 0.3;
        if(win){
            u.coins += bet;
            message.reply(`🎉 CoinFlip won! +${bet} 🪙`);
        } else {
            u.coins -= bet;
            message.reply(`💀 CoinFlip lost! -${bet} 🪙`);
        }
        saveData();
    }
});

// ================= SLOT MACHINE =================
const slotEmojis = ["💎","🥭","🍒","🍉"];
client.on("messageCreate", async message=>{
    if(message.author.bot) return;
    const args = message.content.split(" ");
    const cmd = args[0].toLowerCase();
    createUser(message.author.id);
    const u = data[message.author.id];

    if(cmd === `${prefix}slot`){
        let bet = args[1];
        if(!bet) return message.reply("Enter bet amount or 'all'");
        if(bet.toLowerCase() === "all") bet = Math.min(u.coins,100000);
        else bet = parseInt(bet);
        if(isNaN(bet) || bet<=0) return message.reply("Enter valid amount");
        if(bet > 100000) bet = 100000;
        if(bet > u.coins) return message.reply("Not enough coins");

        // Animated reels simulation
        const reels = [];
        for(let i=0;i<3;i++){
            reels.push(slotEmojis[Math.floor(Math.random()*slotEmojis.length)]);
        }

        let winAmount = 0;
        if(reels.every(r=>r==="💎")) winAmount = bet*3;
        else if(reels.every(r=>r==="🥭")) winAmount = bet*2;
        else if(reels.every(r=>r==="🍒")) winAmount = bet*2;
        else if(reels.every(r=>r==="🍉")) winAmount = bet;
        else winAmount = -bet;

        u.coins += winAmount;
        saveData();
        message.reply(`🎰 [${reels.join(" | ")}]\nResult: ${winAmount>0?`Won ${winAmount} 🪙`:`Lost ${-winAmount} 🪙`}`);
    }
});

// ================= DRAGON UPGRADE =================
client.on("messageCreate", async message=>{
    if(message.author.bot) return;
    const args = message.content.split(" ");
    const cmd = args[0].toLowerCase();
    createUser(message.author.id);
    const u = data[message.author.id];

    if(cmd === `${prefix}upgrade`){
        const dragon = u.dragon;
        if(!dragon) return message.reply("No dragon selected!");
        const lvlUp = parseInt(args[1]) || 1;
        const cost = lvlUp*100; // 100 gems per level
        if(u.gems < cost) return message.reply(`Not enough gems! ${cost} needed`);

        u.gems -= cost;
        u.dragonsLevel[dragon] = (u.dragonsLevel[dragon]||0)+lvlUp;
        saveData();
        message.reply(`🐉 Upgraded ${dragon} by ${lvlUp} level(s). Current Level: ${u.dragonsLevel[dragon]}`);
    }
});

// ================= BATTLE SYSTEM =================
const defaultAttacks = ["Punch","Kick","Push"];
client.on("messageCreate", async message=>{
    if(message.author.bot) return;
    const args = message.content.split(" ");
    const cmd = args[0].toLowerCase();

    if(cmd===`${prefix}challenge`){
        const opponent = message.mentions.users.first();
        if(!opponent) return message.reply("Mention a user to challenge!");
        if(opponent.id === message.author.id) return message.reply("Cannot challenge yourself!");
        message.channel.send(`⚔️ ${message.author.username} challenged ${opponent.username}! Type \`${prefix}challenge accept\` to fight.`);
    }

    if(cmd===`${prefix}challenge` && args[1]==="accept"){
        const challenger = data[message.mentions.users.first().id];
        const challenged = data[message.author.id];

        const challengerPower = 50 + (challenger.dragonsLevel?.[challenger.dragon]||0)*10;
        const challengedPower = 50 + (challenged.dragonsLevel?.[challenged.dragon]||0)*10;

        const winChance = challengerPower/(challengerPower+challengedPower);
        const rand = Math.random();

        let winner, loser;
        if(rand < winChance){ winner = message.mentions.users.first(); loser = message.author; }
        else{ winner = message.author; loser = message.mentions.users.first(); }

        data[winner.id].gems += 25;
        data[loser.id].gems -= 5;
        data[winner.id].battles +=1;
        saveData();

        message.channel.send(`⚔️ Battle Finished!\n🏆 Winner: ${winner.username} (+25 💎)\n💀 Loser: ${loser.username} (-5 💎)`);
    }
});
// ================= LEADERBOARD =================
client.on("messageCreate", async message=>{
    if(message.author.bot) return;
    const command = message.content.split(" ")[0].toLowerCase();

    if(command===`${prefix}lb` || command===`${prefix}leaderboard`){
        const type = message.content.split(" ")[1] || "balance";
        const usersArray = Object.entries(data).map(([id,u])=>({id,...u}));

        if(type==="balance"){
            usersArray.sort((a,b)=>b.coins - a.coins);
            const top = usersArray.slice(0,10);
            const lbEmbed = new MessageEmbed().setTitle("🥇 Balance Leaderboard").setColor("PURPLE");

            top.forEach((u,i)=>{
                const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
                lbEmbed.addField(`${medal} ${i+1}. <@${u.id}>`, `🪙 Coins: ${u.coins}\n💎 Gems: ${u.gems}`,false);
            });
            message.reply({embeds:[lbEmbed]});
        } else if(type==="battles"){
            usersArray.sort((a,b)=>b.battles - a.battles);
            const top = usersArray.slice(0,10);
            const lbEmbed = new MessageEmbed().setTitle("⚔ Battle Wins Leaderboard").setColor("RED");

            top.forEach((u,i)=>{
                const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
                lbEmbed.addField(`${medal} ${i+1}. <@${u.id}>`, `Wins: ${u.battles}`,false);
            });
            message.reply({embeds:[lbEmbed]});
        }
    }
});

// ================= OWNER/ADMIN COMMANDS =================
client.on("messageCreate", async message=>{
    if(message.author.bot) return;
    const args = message.content.split(" ");
    const command = args[0].toLowerCase();
    const ownerId = "1266728371719508062"; // fzboy786_01978

    if(message.author.id!==ownerId) return;

    // SET COINS
    if(command===`${prefix}setmoney`){
        const user = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if(!user||isNaN(amount)) return message.reply("Usage: s setmoney @user <amount>");
        createUser(user.id);
        data[user.id].coins = amount;
        saveData();
        message.reply(`✅ Set ${user.username} coins to ${amount}`);
    }

    // SET GEMS
    if(command===`${prefix}setgems`){
        const user = message.mentions.users.first();
        const amount = parseInt(args[2]);
        if(!user||isNaN(amount)) return message.reply("Usage: s setgems @user <amount>");
        createUser(user.id);
        data[user.id].gems = amount;
        saveData();
        message.reply(`✅ Set ${user.username} gems to ${amount}`);
    }

    // RESET ALL
    if(command===`${prefix}resetall`){
        data = {};
        saveData();
        message.reply("🗑 All data reset successfully!");
    }
});

// ================= HELP COMMAND =================
client.on("messageCreate", async message=>{
    if(message.author.bot) return;
    const cmd = message.content.toLowerCase();

    if(cmd===`${prefix}help`){
        const helpEmbed = new MessageEmbed()
        .setTitle("📜 Sparkle Empire Bot Commands")
        .setColor("BLUE")
        .setDescription(`
**User Commands**
- s daily → Claim daily coins
- s bal / s balance → Show balance
- s deposit <amount> → Deposit coins to bank
- s withdraw <amount> → Withdraw coins from bank
- s profile → Show profile
- s inv / s inventory → Show inventory
- s shop → Show shop items
- s buy <category> <item> → Buy item
- s set <category> <item> → Select owned item
- s cf <amount/all> → CoinFlip
- s slot <amount/all> → Slot Machine
- s upgrade <levels> → Upgrade selected dragon
- s challenge @user → Challenge player
- s challenge accept → Accept challenge
- s lb balance → Leaderboard coins/gems
- s lb battles → Leaderboard battle wins

**Owner Commands**
- s setmoney @user <amount>
- s setgems @user <amount>
- s resetall
        `);
        message.reply({embeds:[helpEmbed]});
    }
});

// ================= BOT LOGIN =================
client.login(process.env.TOKEN);
