require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const db = require('quick.db');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const PREFIX = 's';
const OWNER_ID = '1266728371719508062'; // fzboy786_01978

// --- Dragons ---
const dragons = {
    "grog": { name: "Grog", emoji: "🪨", element: "Earth", price: 5000000 },
    "phoenix": { name: "Phoenix", emoji: "🔥", element: "Fire", price: 10500000 },
    "triton": { name: "Triton", emoji: "🌊", element: "Water", price: 10200000 },
    "rex": { name: "Rex", emoji: "⚡", element: "Lightning", price: 10700000 },
    "zephyr": { name: "Zephyr", emoji: "🌪️", element: "Wind", price: 10300000 }
};

// --- Weapons ---
const weapons = {
    "flame sword": { element: "Fire", attack: 100, price: 1000000 },
    "thunder blade": { element: "Lightning", attack: 110, price: 1200000 },
    "aqua spear": { element: "Water", attack: 95, price: 900000 },
    "stone hammer": { element: "Earth", attack: 105, price: 1050000 },
    "wind dagger": { element: "Wind", attack: 90, price: 850000 }
};

// --- Armours ---
const armours = {
    "dragon plate": { element: "Fire", defence: 100, price: 1000000 },
    "thunder guard": { element: "Lightning", defence: 110, price: 1200000 },
    "aqua shield": { element: "Water", defence: 95, price: 900000 },
    "earth armor": { element: "Earth", defence: 105, price: 1050000 },
    "zephyr cloak": { element: "Wind", defence: 90, price: 850000 }
};

// --- Utility Functions ---
function getSelectedDragon(userId) { return db.get(`selectedDragon_${userId}`); }
function getRank(xp) { return Math.floor(xp / 2500) + 1; }
function getTotalCoins(userId) { return (db.get(`wallet_${userId}`)||0) + (db.get(`bank_${userId}`)||0); }

// --- Message Handler ---
client.on('messageCreate', async message => {
    if (!message.content.startsWith(PREFIX) || message.author.bot) return;
    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const userId = message.author.id;

    // --- Channel Disabled Check ---
    if(db.get(`disabled_${message.channel.id}`) && ![OWNER_ID].includes(userId)) return;

    // ----------------- DAILY -----------------
    if(cmd==='d'||cmd==='daily'){
        const last = db.get(`daily_${userId}`)||0;
        const now = Date.now();
        if(now-last<86400000){
            const rem = 86400000-(now-last);
            const h=Math.floor(rem/3600000), m=Math.floor((rem%3600000)/60000);
            return message.reply(`❌ Already claimed! Next in ${h}h ${m}m`);
        }
        db.set(`daily_${userId}`, now);
        db.add(`wallet_${userId}`,500);
        return message.reply(`🎉 Daily +500 💰`);
    }

    // ----------------- BALANCE -----------------
    if(cmd==='bal'||cmd==='balance'){
        const wallet=db.get(`wallet_${userId}`)||0, bank=db.get(`bank_${userId}`)||0, gems=db.get(`gems_${userId}`)||0;
        return message.reply(`👤 ${message.author.username}\n💼 Wallet: ${wallet}\n🏦 Bank: ${bank}\n💎 Gems: ${gems}`);
    }

    // ----------------- DEPOSIT -----------------
    if(cmd==='d'||cmd==='deposit'){
        const amount=parseInt(args[0]), wallet=db.get(`wallet_${userId}`)||0;
        if(isNaN(amount)||amount<=0) return message.reply("❌ Invalid amount");
        if(wallet<amount) return message.reply("❌ Not enough coins!");
        db.subtract(`wallet_${userId}`, amount); db.add(`bank_${userId}`, amount);
        return message.reply(`💰 Deposited ${amount} 💰`);
    }

    // ----------------- WITHDRAW -----------------
    if(cmd==='w'||cmd==='withdraw'){
        const amount=parseInt(args[0]), bank=db.get(`bank_${userId}`)||0;
        if(isNaN(amount)||amount<=0) return message.reply("❌ Invalid amount");
        if(bank<amount) return message.reply("❌ Not enough coins!");
        db.subtract(`bank_${userId}`, amount); db.add(`wallet_${userId}`, amount);
        return message.reply(`💰 Withdrew ${amount} 💰`);
    }

    // ----------------- GIVE -----------------
    if(cmd==='g'||cmd==='give'){
        const target=message.mentions.users.first(); const amount=parseInt(args[1]);
        if(!target||isNaN(amount)||amount<=0) return message.reply("❌ Invalid usage");
        const wallet=db.get(`wallet_${userId}`)||0;
        if(wallet<amount) return message.reply("❌ Not enough coins!");
        db.subtract(`wallet_${userId}`, amount); db.add(`wallet_${target.id}`, amount);
        return message.reply(`🤝 ${message.author.username} gave ${amount} 💰 to ${target.username}`);
    }

    // ----------------- COINFLIP -----------------
    if(cmd==='cf'||cmd==='coinflip'){
        let bet=parseInt(args[0]);
        if(isNaN(bet)||bet<=0) return message.reply("❌ Invalid bet");
        if(bet>100000) bet=100000;
        const wallet=db.get(`wallet_${userId}`)||0;
        if(wallet<bet) return message.reply("❌ Not enough coins!");
        db.subtract(`wallet_${userId}`, bet);
        const result=Math.random()<0.5?"Heads":"Tails";
        await message.reply("🪙 Flipping... ⏳");
        setTimeout(()=>{
            if(result==="Heads"){ db.add(`wallet_${userId}`,bet*2); message.channel.send(`🎉 Heads! Won ${bet*2}`);}
            else message.channel.send(`😢 Tails! Lost ${bet}`);
        },2000);
    }

    // ----------------- SLOT -----------------
    if(cmd==='s'||cmd==='slot'){
        let bet=parseInt(args[0]);
        if(isNaN(bet)||bet<=0) return message.reply("❌ Invalid bet");
        if(bet>100000) bet=100000;
        const wallet=db.get(`wallet_${userId}`)||0;
        if(wallet<bet) return message.reply("❌ Not enough coins!");
        db.subtract(`wallet_${userId}`, bet);
        const symbols=["💎","🥭","🍉"];
        const roll=[symbols[Math.floor(Math.random()*3)],symbols[Math.floor(Math.random()*3)],symbols[Math.floor(Math.random()*3)]];
        await message.reply("🎰 Rolling... ⏳");
        setTimeout(()=>{
            const [a,b,c]=roll; let msg=`🎰 Result: ${a}${b}${c}\n`;
            if(a===b && b===c){
                if(a==="💎"){ db.add(`wallet_${userId}`,bet*3); msg+=`💎 Jackpot! Won ${bet*3}`;}
                else if(a==="🥭"){ db.add(`wallet_${userId}`,bet*2); msg+=`🥭 Won ${bet*2}`;}
                else { db.add(`wallet_${userId}`,bet); msg+=`🍉 Tie! Bet returned`;}
            } else msg+=`😢 Lost ${bet}`;
            message.channel.send(msg);
        },2500);
    }

    // ----------------- DRAGON SELECTION -----------------
    if(cmd==='set'){
        const dragonName=args.join(' ').toLowerCase();
        if(!dragons[dragonName]) return message.reply("❌ Dragon not found!");
        db.set(`selectedDragon_${userId}`,dragonName);
        return message.reply(`${dragons[dragonName].emoji} ${dragons[dragonName].name} selected!`);
    }

    // ----------------- FEED DRAGON -----------------
    if(cmd==='feed'){
        const sel=getSelectedDragon(userId); if(!sel) return message.reply("❌ Select a dragon first!");
        const gems=db.get(`gems_${userId}`)||0; if(gems<100) return message.reply("❌ Not enough gems!");
        const level=db.get(`dragonLevel_${userId}`)||1; if(level>=250) return message.reply("❌ Max level 250");
        db.subtract(`gems_${userId}`,100); db.add(`dragonLevel_${userId}`,1);
        return message.reply(`🔥 ${dragons[sel].name} leveled up! ⭐ Level: ${level+1}`);
    }

    // ----------------- PROFILE -----------------
    if(cmd==='profile'){
        const dragon=getSelectedDragon(userId);
        const dragonLvl=db.get(`dragonLevel_${userId}`)||0;
        const wallet=db.get(`wallet_${userId}`)||0, bank=db.get(`bank_${userId}`)||0, gems=db.get(`gems_${userId}`)||0, xp=db.get(`xp_${userId}`)||0;
        const rank=getRank(xp);
        let dragonDisplay=dragon?`${dragons[dragon].emoji} ${dragons[dragon].name} (Lvl ${dragonLvl})`:"None";
        return message.reply(`👤 ${message.author.username}\n🐉 Dragon: ${dragonDisplay}\n💼 Wallet: ${wallet}\n🏦 Bank: ${bank}\n💎 Gems: ${gems}\n🏆 Rank: #${rank} | XP: ${xp}`);
    }

    // ----------------- RANK -----------------
    if(cmd==='rank'){
        const xp=db.get(`xp_${userId}`)||0, rank=getRank(xp), nextXP=rank*2500, remXP=nextXP-xp;
        return message.reply(`🏆 Rank: #${rank}\n⭐ XP: ${xp}/${nextXP} (Next rank in ${remXP} XP)`);
    }

    // ----------------- SHOP -----------------
    if(cmd==='shop'){
        let shopText=`🛒 SPARK BOT SHOP\n\n🐉 DRAGONS\n`;
        for(let d in dragons) shopText+=`${dragons[d].emoji} ${dragons[d].name} | Price: ${dragons[d].price} 💰\n`;
        shopText+=`\n⚔️ WEAPONS\n`; for(let w in weapons) shopText+=`${weapons[w].element} ${w} | Attack: ${weapons[w].attack} | Price: ${weapons[w].price} 💰\n`;
        shopText+=`\n🛡️ ARMOURS\n`; for(let a in armours) shopText+=`${armours[a].element} ${a} | Defence: ${armours[a].defence} | Price: ${armours[a].price} 💰\n`;
        shopText+=`\n💡 Buy an item using: s buy <item name>\n`;
        return message.reply(shopText);
    }

    // ----------------- BUY -----------------
    if(cmd==='buy'){
        const itemName=args.join(' ').toLowerCase(); let price=0;
        if(dragons[itemName]) price=dragons[itemName].price;
        else if(weapons[itemName]) price=weapons[itemName].price;
        else if(armours[itemName]) price=armours[itemName].price;
        else return message.reply("❌ Item not found!");
        const wallet=db.get(`wallet_${userId}`)||0; if(wallet<price) return message.reply("❌ Not enough coins!");
        db.subtract(`wallet_${userId}`,price); db.push(`inventory_${userId}`,itemName);
        return message.reply(`✅ Purchased ${itemName} for ${price} 💰`);
    }

    // ----------------- HELP -----------------
    if(cmd==='help'){
        const helpText = `
📜 **SPARK BOT COMMANDS**

**Economy:** s d/daily, s bal/balance, s d/deposit <amount>, s w/withdraw <amount>, s g/give @user <amount>
**Games:** s cf/coinflip <bet>, s s/slot <bet>
**Dragon:** s set <dragon>, s feed, s challenge @user, s accept
**Profile/Rank:** s profile, s rank, s lb balance, s lb battles
**Shop:** s shop, s buy <item>
**Admin:** s disable, s enable
**Owner:** s setmoney <name> <amount>, s setgems <name> <amount>, s admin add/remove/list, s resetall
`;
        return message.reply(helpText);
    }

    // ----------------- SERVER ADMIN -----------------
    if(cmd==='disable'){
        if(!message.member.permissions.has('Administrator')) return message.reply("❌ Admin only!");
        db.set(`disabled_${message.channel.id}`,true);
        return message.reply("✅ Bot disabled in this channel.");
    }
    if(cmd==='enable'){
        if(!message.member.permissions.has('Administrator')) return message.reply("❌ Admin only!");
        db.delete(`disabled_${message.channel.id}`);
        return message.reply("✅ Bot enabled in this channel.");
    }

    // ----------------- OWNER COMMANDS -----------------
    if(['setmoney','setgems'].includes(cmd)){
        if(userId!==OWNER_ID) return message.reply("❌ Only owner");
        const target=message.mentions.users.first(); const amount=parseInt(args[1]);
        if(!target||isNaN(amount)) return message.reply("❌ Invalid");
        if(cmd==='setmoney'){ db.set(`wallet_${target.id}`,amount); return message.reply(`💰 Set ${target.username}'s coins to ${amount}`);}
        if(cmd==='setgems'){ db.set(`gems_${target.id}`,amount); return message.reply(`💎 Set ${target.username}'s gems to ${amount}`);}
    }

    if(cmd==='admin'){
        if(userId!==OWNER_ID) return message.reply("❌ Only owner");
        const action=args[0]; const target=message.mentions.users.first();
        let admins=db.get('botAdmins')||[];
        if(action==='add'){ if(!target) return message.reply("❌ Mention"); if(admins.includes(target.id)) return message.reply("❌ Already admin"); admins.push(target.id); db.set('botAdmins',admins); return message.reply(`✅ ${target.username} added as bot admin`);}
        if(action==='remove'){ if(!target) return message.reply("❌ Mention"); admins=admins.filter(id=>id!==target.id); db.set('botAdmins',admins); return message.reply(`✅ ${target.username} removed from bot admins`);}
        if(action==='list'){ if(admins.length===0) return message.reply("❌ No admins"); return message.reply(`👑 Bot Admins:\n${admins.map(id=>`<@${id}>`).join('\n')}`);}
    }

    if(cmd==='resetall'){
        if(userId!==OWNER_ID) return message.reply("❌ Only owner");
        db.deleteAll();
        return message.reply("⚠️ All bot data reset!");
    }

});

client.once('ready',()=>{console.log(`${client.user.username} is online!`);});
client.login(process.env.TOKEN);
