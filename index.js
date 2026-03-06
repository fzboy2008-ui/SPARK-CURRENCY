const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js")
const fs = require("fs")

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]})

const prefix = "s"
const owner = "fzboy786_01978"

let db={}
if(fs.existsSync("db.json")){
db=JSON.parse(fs.readFileSync("db.json"))
}

function save(){fs.writeFileSync("db.json",JSON.stringify(db,null,2))}

function userData(id){
if(!db[id]){
db[id]={
wallet:0,
bank:0,
xp:0,
rank:0,
gems:0,
battles:0,
wins:0,
dragon:null,
dragons:[],
weapons:[],
armours:[],
admins:[]
}}
return db[id]
}

function maxBet(n){
if(n==="all") return 500000
if(parseInt(n)>500000) return 500000
return parseInt(n)
}

client.on("messageCreate",async msg=>{

if(msg.author.bot) return
let user=userData(msg.author.id)

user.xp++

let need=(user.rank+1)*250
if(user.xp>=need){
user.rank++
user.wallet+=5000
msg.channel.send(`🏆 ${msg.author} ranked up to **${user.rank}** and got 💰5000`)
}

save()

if(!msg.content.startsWith(prefix)) return

const args=msg.content.slice(prefix.length).trim().split(/ +/)
const cmd=args.shift()?.toLowerCase()

/* HELP */

if(cmd==="help"){
return msg.reply(`
📜 COMMANDS

💰 ECONOMY
s daily
s cash
s give
s deposit
s withdraw

🎰 GAMBLING
s cf
s slot

📊 PROFILE
s profile
s lvl

🐉 DRAGONS
s dragon buy
s dragon set
s feed

⚔ BATTLE
s challenge
s accept

🛒 SHOP
s shop

🎒 INVENTORY
s inv

🏆 LEADERBOARD
s lb
`)
}

/* DAILY */

if(cmd==="daily"){
if(!user.lastDaily) user.lastDaily=0
let cd=86400000
let diff=Date.now()-user.lastDaily

if(diff<cd){
let t=Math.floor((cd-diff)/1000)
let h=Math.floor(t/3600)
let m=Math.floor(t%3600/60)
return msg.reply(`⏳ next reward in ${h}h ${m}m`)
}

user.wallet+=500
user.lastDaily=Date.now()
save()
return msg.reply("🎁 You received **500** coins")
}

/* CASH */

if(cmd==="cash"){
return msg.reply(`
👤 USER : ${msg.author.username}

💰 WALLET : ${user.wallet}
🏦 BANK : ${user.bank}
`)
}

/* DEPOSIT */

if(cmd==="deposit"){
let a=parseInt(args[0])
if(a>user.wallet) return msg.reply("❌ not enough wallet")
user.wallet-=a
user.bank+=a
save()
msg.reply(`🏦 deposited ${a}`)
}

/* WITHDRAW */

if(cmd==="withdraw"){
let a=parseInt(args[0])
if(a>user.bank) return msg.reply("❌ not enough bank")
user.bank-=a
user.wallet+=a
save()
msg.reply(`💰 withdrew ${a}`)
}

/* GIVE */

if(cmd==="give"){
let t=msg.mentions.users.first()
let a=parseInt(args[1])
if(!t) return
if(a>user.wallet) return msg.reply("❌ not enough coins")

user.wallet-=a
userData(t.id).wallet+=a
save()

msg.reply(`💸 sent ${a} to ${t.username}`)
}

/* LEVEL */

if(cmd==="lvl"){
let need=(user.rank+1)*250
let percent=Math.floor((user.xp/need)*100)

return msg.reply(`
🏆 RANK : ${user.rank}
✨ XP : ${user.xp}/${need}
📊 ${percent}%
`)
}

/* PROFILE */

if(cmd==="profile"){
let dragon=user.dragon?user.dragon:"None"

return msg.reply(`
👤 ${msg.author.username}

🏆 Rank : ${user.rank}
💰 Wallet : ${user.wallet}
🏦 Bank : ${user.bank}

🐉 Dragon : ${dragon}
💎 Gems : ${user.gems}
`)
}

/* COIN FLIP */

if(cmd==="cf"){
let bet=maxBet(args[0])
if(bet>user.wallet) return msg.reply("❌ not enough coins")

let m=await msg.reply("🪙 flipping coin...")
setTimeout(()=>{
let win=Math.random()<0.20

if(win){
user.wallet+=bet
m.edit(`🎉 WIN +${bet}`)
}else{
user.wallet-=bet
m.edit(`💀 LOSE -${bet}`)
}

save()

},2000)
}

/* SLOT */

if(cmd==="slot"){
let bet=maxBet(args[0])
if(bet>user.wallet) return msg.reply("❌ not enough coins")

const items=["🍒","🍉","💎","🍋"]

let m=await msg.reply("🎰 spinning...")

setTimeout(()=>{

let r1=items[Math.floor(Math.random()*4)]
let r2=items[Math.floor(Math.random()*4)]
let r3=items[Math.floor(Math.random()*4)]

let result=`${r1} | ${r2} | ${r3}`

let win=Math.random()<0.5

if(win){
user.wallet+=bet
m.edit(`🎰 ${result}\n🎉 WIN +${bet}`)
}else{
user.wallet-=bet
m.edit(`🎰 ${result}\n💀 LOSE -${bet}`)
}

save()

},2000)
}

/* SHOP */

if(cmd==="shop"){
msg.reply(`
🛒 SHOP

🐉 DRAGON : 4m - 6m
🗡 WEAPON : 1m
🛡 ARMOUR : 500k

use:
s dragon buy
`)
}

/* DRAGON BUY */

if(cmd==="dragon" && args[0]==="buy"){

let price=4000000

if(user.wallet<price) return msg.reply("❌ need 4m")

user.wallet-=price
user.dragons.push({name:"Fire Dragon",lvl:1})

save()

msg.reply("🐉 Fire Dragon purchased")
}

/* DRAGON SET */

if(cmd==="dragon" && args[0]==="set"){
if(!user.dragons.length) return msg.reply("❌ no dragon")

user.dragon=user.dragons[0].name
save()

msg.reply(`🐉 selected ${user.dragon}`)
}

/* FEED */

if(cmd==="feed"){
if(user.gems<100) return msg.reply("❌ need 100 gems")

let d=user.dragons[0]
d.lvl++

user.gems-=100

save()

msg.reply(`🐉 dragon level ${d.lvl}`)
}

/* BATTLE */

let battles={}

if(cmd==="challenge"){
let t=msg.mentions.users.first()
if(!t) return

battles[t.id]=msg.author.id

msg.reply(`⚔ ${t} type **s accept**`)
}

if(cmd==="accept"){
if(!battles[msg.author.id]) return

let enemy=battles[msg.author.id]

delete battles[msg.author.id]

let win=Math.random()<0.5

if(win){
userData(enemy).wins++
userData(enemy).battles++
userData(enemy).gems+=5
msg.channel.send(`🏆 <@${enemy}> wins and got 💎5`)
}else{
user.wins++
user.battles++
user.gems+=5
msg.channel.send(`🏆 ${msg.author} wins and got 💎5`)
}

save()
}

/* LEADERBOARD */

if(cmd==="lb"){

let top=Object.entries(db)
.sort((a,b)=> (b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank))
.slice(0,10)

let text=""

top.forEach((u,i)=>{
text+=`${i+1}. <@${u[0]}> — ${u[1].wallet+u[1].bank}\n`
})

msg.reply(`🏆 LEADERBOARD\n\n${text}`)
}

/* OWNER COMMANDS */

if(msg.author.username===owner){

if(cmd==="admin"){
if(args[0]==="add"){
let u=msg.mentions.users.first()
db.admins=db.admins||[]
db.admins.push(u.id)
save()
msg.reply("admin added")
}

if(args[0]==="list"){
msg.reply(`admins: ${db.admins}`)
}
}

if(cmd==="setmoney"){
let u=msg.mentions.users.first()
let a=parseInt(args[1])
userData(u.id).wallet=a
save()
msg.reply("money set")
}

if(cmd==="reset"){
if(args[0]==="all"){
db={}
save()
msg.reply("database reset")
}
}

}

/* CHANNEL ENABLE */

if(cmd==="enable"){
if(!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))return
msg.channel.send("✅ bot enabled here")
}

if(cmd==="disable"){
if(!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))return
msg.channel.send("❌ bot disabled here")
}

})

client.login(process.env.TOKEN)
