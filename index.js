import discord
from discord.ext import commands
import json
import random
import os

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

DATA_FILE = "players.json"

# -----------------------------
# Data System
# -----------------------------

def load_data():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w") as f:
            json.dump({}, f)

    with open(DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)

def create_player(user_id):

    data = load_data()

    if str(user_id) not in data:
        data[str(user_id)] = {
            "coins": 100,
            "xp": 0,
            "level": 1,
            "hp": 100,
            "attack": 10,
            "defense": 5,
            "inventory": [],
            "weapon": None,
            "armor": None
        }

        save_data(data)

# -----------------------------
# Level System
# -----------------------------

def add_xp(user_id, amount):

    data = load_data()
    player = data[str(user_id)]

    player["xp"] += amount

    level_up = player["level"] * 100

    if player["xp"] >= level_up:

        player["level"] += 1
        player["xp"] = 0
        player["hp"] += 10
        player["attack"] += 2
        player["defense"] += 2

    save_data(data)

# -----------------------------
# Bot Ready
# -----------------------------

@bot.event
async def on_ready():
    print("RPG BOT V5 ONLINE")

# -----------------------------
# Profile Command
# -----------------------------

@bot.command()
async def profile(ctx):

    create_player(ctx.author.id)

    data = load_data()
    p = data[str(ctx.author.id)]

    embed = discord.Embed(
        title=f"{ctx.author.name} Profile",
        color=discord.Color.blue()
    )

    embed.add_field(name="Level", value=p["level"])
    embed.add_field(name="XP", value=p["xp"])
    embed.add_field(name="Coins", value=p["coins"])

    embed.add_field(name="HP", value=p["hp"])
    embed.add_field(name="Attack", value=p["attack"])
    embed.add_field(name="Defense", value=p["defense"])

    weapon = p["weapon"] if p["weapon"] else "None"
    armor = p["armor"] if p["armor"] else "None"

    embed.add_field(name="Weapon", value=weapon)
    embed.add_field(name="Armor", value=armor)

    await ctx.send(embed=embed)

# -----------------------------
# Daily Command
# -----------------------------

@bot.command()
async def daily(ctx):

    create_player(ctx.author.id)

    data = load_data()
    reward = random.randint(50,150)

    data[str(ctx.author.id)]["coins"] += reward

    save_data(data)

    embed = discord.Embed(
        title="Daily Reward",
        description=f"You received **{reward} coins**",
        color=discord.Color.green()
    )

    await ctx.send(embed=embed)

# -----------------------------
# Work Command
# -----------------------------

@bot.command()
async def work(ctx):

    create_player(ctx.author.id)

    reward = random.randint(20,80)

    data = load_data()
    data[str(ctx.author.id)]["coins"] += reward

    save_data(data)

    embed = discord.Embed(
        title="Work Complete",
        description=f"You earned **{reward} coins**",
        color=discord.Color.orange()
    )

    await ctx.send(embed=embed)

# -----------------------------
# Shop System
# -----------------------------

shop_items = {

    "sword":{
        "price":200,
        "attack":5
    },

    "greatsword":{
        "price":500,
        "attack":10
    },

    "armor":{
        "price":300,
        "defense":5
    },

    "knight_armor":{
        "price":700,
        "defense":10
    }

}

@bot.command()
async def shop(ctx):

    embed = discord.Embed(
        title="RPG Shop",
        color=discord.Color.gold()
    )

    for item in shop_items:
        embed.add_field(
            name=item,
            value=f"Price: {shop_items[item]['price']}",
            inline=False
        )

    await ctx.send(embed=embed)

# -----------------------------
# Buy Command
# -----------------------------

@bot.command()
async def buy(ctx,item):

    create_player(ctx.author.id)

    if item not in shop_items:
        await ctx.send("Item not found")
        return

    data = load_data()
    player = data[str(ctx.author.id)]

    price = shop_items[item]["price"]

    if player["coins"] < price:
        await ctx.send("Not enough coins")
        return

    player["coins"] -= price
    player["inventory"].append(item)

    save_data(data)

    embed = discord.Embed(
        title="Item Purchased",
        description=f"You bought **{item}**",
        color=discord.Color.green()
    )

    await ctx.send(embed=embed)

# -----------------------------
# Inventory
# -----------------------------

@bot.command()
async def inventory(ctx):

    create_player(ctx.author.id)

    data = load_data()
    items = data[str(ctx.author.id)]["inventory"]

    if not items:
        await ctx.send("Inventory empty")
        return

    embed = discord.Embed(
        title="Inventory",
        description="\n".join(items),
        color=discord.Color.blue()
    )

    await ctx.send(embed=embed)

# -----------------------------
# Equip System
# -----------------------------

@bot.command()
async def equip(ctx,item):

    create_player(ctx.author.id)

    data = load_data()
    player = data[str(ctx.author.id)]

    if item not in player["inventory"]:
        await ctx.send("You don't own this item")
        return

    if "sword" in item:
        player["weapon"] = item

    if "armor" in item:
        player["armor"] = item

    save_data(data)

    await ctx.send(f"{item} equipped")

# -----------------------------
# Adventure Command
# -----------------------------

@bot.command()
async def adventure(ctx):

    create_player(ctx.author.id)

    monster = random.choice(["Slime","Goblin","Wolf"])
    reward = random.randint(30,100)
    xp = random.randint(20,60)

    data = load_data()
    data[str(ctx.author.id)]["coins"] += reward

    save_data(data)

    add_xp(ctx.author.id,xp)

    embed = discord.Embed(
        title="Adventure",
        description=f"You defeated a **{monster}**",
        color=discord.Color.red()
    )

    embed.add_field(name="Coins",value=reward)
    embed.add_field(name="XP",value=xp)

    await ctx.send(embed=embed)

bot.run("YOUR_TOKEN")
# -----------------------------
# Sell System
# -----------------------------

@bot.command()
async def sell(ctx,item):

    create_player(ctx.author.id)

    data = load_data()
    player = data[str(ctx.author.id)]

    if item not in player["inventory"]:
        await ctx.send("You don't own this item")
        return

    price = int(shop_items.get(item,{}).get("price",50) * 0.5)

    player["coins"] += price
    player["inventory"].remove(item)

    save_data(data)

    embed = discord.Embed(
        title="Item Sold",
        description=f"You sold **{item}** for **{price} coins**",
        color=discord.Color.orange()
    )

    await ctx.send(embed=embed)

# -----------------------------
# Leaderboard
# -----------------------------

@bot.command()
async def leaderboard(ctx):

    data = load_data()

    sorted_players = sorted(
        data.items(),
        key=lambda x: x[1]["level"],
        reverse=True
    )

    embed = discord.Embed(
        title="Top Players",
        color=discord.Color.gold()
    )

    for i,(uid,player) in enumerate(sorted_players[:10],start=1):

        embed.add_field(
            name=f"#{i}",
            value=f"<@{uid}> | Level {player['level']}",
            inline=False
        )

    await ctx.send(embed=embed)

# -----------------------------
# Quest System
# -----------------------------

quests = {

    "hunt_slime":{
        "xp":50,
        "coins":80
    },

    "kill_goblin":{
        "xp":80,
        "coins":120
    }

}

@bot.command()
async def quests(ctx):

    embed = discord.Embed(
        title="Available Quests",
        color=discord.Color.purple()
    )

    for q in quests:

        embed.add_field(
            name=q,
            value=f"XP: {quests[q]['xp']} | Coins: {quests[q]['coins']}",
            inline=False
        )

    await ctx.send(embed=embed)

@bot.command()
async def quest(ctx,name):

    create_player(ctx.author.id)

    if name not in quests:
        await ctx.send("Quest not found")
        return

    reward = quests[name]

    data = load_data()
    data[str(ctx.author.id)]["coins"] += reward["coins"]

    save_data(data)

    add_xp(ctx.author.id,reward["xp"])

    embed = discord.Embed(
        title="Quest Complete",
        description=name,
        color=discord.Color.green()
    )

    embed.add_field(name="Coins",value=reward["coins"])
    embed.add_field(name="XP",value=reward["xp"])

    await ctx.send(embed=embed)

# -----------------------------
# Loot Drop System
# -----------------------------

loot_items = [
    "sword",
    "greatsword",
    "armor",
    "knight_armor"
]

@bot.command()
async def loot(ctx):

    create_player(ctx.author.id)

    item = random.choice(loot_items)

    data = load_data()
    data[str(ctx.author.id)]["inventory"].append(item)

    save_data(data)

    embed = discord.Embed(
        title="Loot Found",
        description=f"You found **{item}**",
        color=discord.Color.teal()
    )

    await ctx.send(embed=embed)

# -----------------------------
# Crafting System
# -----------------------------

recipes = {

    "mega_sword":{
        "items":["sword","greatsword"],
        "attack":20
    }

}

@bot.command()
async def craft(ctx,item):

    create_player(ctx.author.id)

    if item not in recipes:
        await ctx.send("Recipe not found")
        return

    data = load_data()
    player = data[str(ctx.author.id)]

    needed = recipes[item]["items"]

    for i in needed:
        if i not in player["inventory"]:
            await ctx.send("Missing materials")
            return

    for i in needed:
        player["inventory"].remove(i)

    player["inventory"].append(item)

    save_data(data)

    embed = discord.Embed(
        title="Craft Successful",
        description=f"You crafted **{item}**",
        color=discord.Color.green()
    )

    await ctx.send(embed=embed)

# -----------------------------
# Stats Command
# -----------------------------

@bot.command()
async def stats(ctx):

    create_player(ctx.author.id)

    data = load_data()
    p = data[str(ctx.author.id)]

    embed = discord.Embed(
        title=f"{ctx.author.name} Stats",
        color=discord.Color.blue()
    )

    embed.add_field(name="Level",value=p["level"])
    embed.add_field(name="HP",value=p["hp"])
    embed.add_field(name="Attack",value=p["attack"])
    embed.add_field(name="Defense",value=p["defense"])

    await ctx.send(embed=embed)

# -----------------------------
# Advanced Shop UI
# -----------------------------

@bot.command()
async def shop2(ctx):

    embed = discord.Embed(
        title="Advanced RPG Shop",
        description="Better weapons available",
        color=discord.Color.dark_gold()
    )

    embed.add_field(
        name="Greatsword",
        value="Attack +10 | Price 500",
        inline=False
    )

    embed.add_field(
        name="Knight Armor",
        value="Defense +10 | Price 700",
        inline=False
    )

    await ctx.send(embed=embed)

# -----------------------------
# Item Rarity System
# -----------------------------

rarity = {

    "sword":"Common",
    "armor":"Common",
    "greatsword":"Rare",
    "knight_armor":"Epic",
    "mega_sword":"Legendary"

}

@bot.command()
async def item(ctx,name):

    if name not in rarity:
        await ctx.send("Item not found")
        return

    embed = discord.Embed(
        title=name,
        color=discord.Color.blurple()
    )

    embed.add_field(
        name="Rarity",
        value=rarity[name]
    )

    await ctx.send(embed=embed)
