const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const prefix = "s";
const owner = "fzboy786_01978";
const DB = "./database.json";

let db = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : {
  users:{},
  admins:[],
  disabledChannels:[]
};

function save(){
  fs.writeFileSync(DB, JSON.stringify(db,null,2));
}

function getUser(id){
  if(!db.users[id]){
    db.users[id]={
      wallet:0,
      bank:0,
      xp:0,
      rank:0,
      gems:0,
      dragon:null,
      dragonLvl:1,
      dragons:[],
      weapons:[],
      armours:[],
      battles:0,
      lastDaily:0
    }
  }
  return db.users[id]
}

function limitBet(x){
  if(x>500000) return 500000
  return x
}

client.on("messageCreate", async message=>{

if(message.author.bot) return
if(!message.content.startsWith(prefix)) return

if(db.disabledChannels.includes(message.channel.id)) return

const args = message.content.slice(prefix.length).trim().split(/ +/)
const cmd = args.shift()?.toLowerCase()

const user = getUser(message.author.id)


// DAILY

if(cmd==="daily"){

let diff = Date.now()-user.lastDaily

if(diff<86400000){

let left = 86400000-diff

let h = Math.floor(left/3600000)
let m = Math.floor(left%3600000/60000)

return message.reply(`⏳ Next reward in ${h}h ${m}m`)
}

user.wallet+=500
user.lastDaily=Date.now()
save()

return message.reply("🎁 You received **500 coins**")
}



// CASH

if(cmd==="cash"){

return message.reply(`👤 ${message.author.username}

💰 Wallet : ${user.wallet}
🏦 Bank : ${user.bank}`)
}



// DEPOSIT

if(cmd==="deposit"){

let amt = parseInt(args[0])

if(!amt || amt<=0) return

if(amt>user.wallet) return message.reply("Not enough wallet")

user.wallet-=amt
user.bank+=amt

save()

return message.reply(`🏦 Deposited ${amt}`)
}



// WITHDRAW

if(cmd==="withdraw"){

let amt=parseInt(args[0])

if(!amt || amt<=0) return

if(amt>user.bank) return message.reply("Not enough bank")

user.bank-=amt
user.wallet+=amt

save()

return message.reply(`🏧 Withdrawn ${amt}`)
}



// GIVE

if(cmd==="give"){

let target=message.mentions.users.first()
let amt=parseInt(args[1])

if(!target || !amt) return

if(amt>user.wallet) return message.reply("Not enough coins")

let t=getUser(target.id)

user.wallet-=amt
t.wallet+=amt

save()

return message.reply(`💸 Sent ${amt} coins to ${target.username}`)
}



// COINFLIP

if(cmd==="cf"){

let amt=args[0]==="all"?user.wallet:parseInt(args[0])

amt=limitBet(amt)

if(!amt || amt<=0) return

if(amt>user.wallet) return message.reply("Not enough coins")

let msg=await message.reply("🪙 Flipping coin...")

setTimeout(()=>{

if(Math.random()<0.20){

user.wallet+=amt
msg.edit(`🎉 You won **${amt}** coins`)
}else{

user.wallet-=amt
msg.edit(`💀 You lost **${amt}** coins`)
}

save()

},1500)

}



// SLOT

if(cmd==="slot"){

let amt=args[0]==="all"?user.wallet:parseInt(args[0])

amt=limitBet(amt)

if(!amt || amt<=0) return

if(amt>user.wallet) return message.reply("Not enough coins")

let slots=["🍒","🍉","💎","🍋","⭐"]

let msg=await message.reply("🎰 | 🎰 | 🎰")

setTimeout(()=>{

let s1=slots[Math.floor(Math.random()*slots.length)]
let s2=slots[Math.floor(Math.random()*slots.length)]
let s3=slots[Math.floor(Math.random()*slots.length)]

let win=Math.random()<0.5

if(win){
user.wallet+=amt
msg.edit(`${s1} | ${s2} | ${s3}\n🎉 You won ${amt}`)
}else{
user.wallet-=amt
msg.edit(`${s1} | ${s2} | ${s3}\n💀 You lost ${amt}`)
}

save()

},2000)

}



// SHOP

if(cmd==="shop"){

return message.reply(`🛒 SHOP

🐉 Dragons : 4M - 6M
🗡 Weapons : 1M
🛡 Armours : 500K`)
}



// INVENTORY

if(cmd==="inv"){

return message.reply(`🎒 INVENTORY

🐉 Dragons : ${user.dragons.length}
🗡 Weapons : ${user.weapons.length}
🛡 Armours : ${user.armours.length}
💎 Gems : ${user.gems}`)
}



// DRAGON SET

if(cmd==="dragon" && args[0]==="set"){

let name=args[1]

if(!user.dragons.includes(name)) return message.reply("You don't own this dragon")

user.dragon=name
save()

return message.reply(`🐉 Dragon selected : ${name}`)
}



// FEED DRAGON

if(cmd==="feed"){

if(!user.dragon) return message.reply("No dragon selected")

if(user.gems<100) return message.reply("Need 100 gems")

user.gems-=100
user.dragonLvl++

save()

return message.reply(`🐉 Dragon upgraded to level ${user.dragonLvl}`)
}



// BATTLE

if(cmd==="challenge"){

let target=message.mentions.users.first()

if(!target) return

let enemy=getUser(target.id)

if(!user.dragon || !enemy.dragon)
return message.reply("Both players must select dragon")

message.channel.send(`${target} type **s accept**`)
}



// ACCEPT

if(cmd==="accept"){

let win=Math.random()<0.5

if(win){

user.gems+=5
user.battles++

save()

return message.reply("⚔️ Battle finished\n🏆 You won\n💎 +5 gems")

}else{

return message.reply("⚔️ Battle finished\n💀 You lost")

}

}



// LEADERBOARD

if(cmd==="lb"){

let top=Object.entries(db.users)
.sort((a,b)=>b[1].wallet+b[1].bank-(a[1].wallet+a[1].bank))
.slice(0,10)

let text=""

top.forEach((u,i)=>{

text+=`${i+1}. <@${u[0]}> — ${u[1].wallet+u[1].bank}\n`

})

return message.reply(`🏆 Leaderboard

${text}`)
}



// ENABLE / DISABLE

if(cmd==="enable"){

if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return

db.disabledChannels = db.disabledChannels.filter(id=>id!==message.channel.id)

save()

return message.reply("✅ Bot enabled here")

}

if(cmd==="disable"){

if(!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return

db.disabledChannels.push(message.channel.id)

save()

return message.reply("⛔ Bot disabled here")

}



// OWNER COMMANDS

if(message.author.username===owner){

if(cmd==="admin" && args[0]==="add"){

let u=message.mentions.users.first()

db.admins.push(u.id)

save()

return message.reply("Admin added")

}

if(cmd==="admin" && args[0]==="list"){

return message.reply(db.admins.map(id=>`<@${id}>`).join("\n"))

}

if(cmd==="setmoney"){

let u=message.mentions.users.first()

let amt=parseInt(args[1])

getUser(u.id).wallet=amt

save()

return message.reply("Money set")

}

if(cmd==="reset" && args[0]==="all"){

db.users={}
save()

return message.reply("Database reset")

}

}

})

client.login(process.env.TOKEN)
