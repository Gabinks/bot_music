const Discord = require("discord.js")
const dotenv = require("dotenv")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const fs = require("fs")

const { Player } = require("discord-player")

dotenv.config()
const TOKEN = process.env.TOKEN

const LOAD_SLASH = process.argv[2] == "load"

const CLIENT_ID = '957662669207375913'
const GUILD_ID = '890326543988052048'

const client = new Discord.Client({
    intents: [
        "GUILDS",
        "GUILD_VOICE_STATES"
    ]
})

client.slashcommands = new Discord.Collection()
client.player = new Player(client, {
    ytdlOptions: {
        quality: "highestaudio",
        highWaterMark: 1 << 25
    }
})

const commandFiles = fs.readdirSync("./moderation").filter(file => file.endsWith(".js"));

let commands = []

client.commands = new Discord.Collection()

for (const file of commandFiles){
    const command = require(`./moderation/${file}`);
    client.commands.set(command.data.name, command);
    if (LOAD_SLASH) commands.push(command.data.toJSON());
}

const slashFiles = fs.readdirSync("./slash").filter(file => file.endsWith(".js"))
for (const file of slashFiles){
    const slashcmd = require(`./slash/${file}`)
    client.slashcommands.set(slashcmd.data.name, slashcmd)
    if (LOAD_SLASH) commands.push(slashcmd.data.toJSON())
}

if (LOAD_SLASH) {
    const rest = new REST({ version: "9" }).setToken(TOKEN)
    console.log("Deploying slash commands")
    rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {body: commands})
    .then(() => {
        console.log("Successfully loaded")
        process.exit(0)
    })
    .catch((err) => {
        if (err){
            console.log(err)
            process.exit(1)
        }
    })
}
if (LOAD_MODERATION){
    const rest = new REST({
        version: "9"
    }).setToken(TOKEN);

    console.log("Deploying moderation commands")

    (async () => {
        try{
            if (process.env.ENV === "production"){
                await rest.put(Routes.applicationCommands(CLIENT_ID), {
                    body: commands
                });
                console.log('Moderation file initialized globally.');
            } else {
                await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
                    body: commands
                });
                console.log('Moderation file initialized locally.');
            }
        } catch (err) {
            if (err) console.error(err);
        }
    })();
}
else {
    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}`)
    })
    client.on("interactionCreate", (interaction) => {
        async function handleCommand() {
            if (!interaction.isCommand()) return

            const slashcmd = client.slashcommands.get(interaction.commandName)
            if (!slashcmd) interaction.reply("Not a valid slash command")

            await interaction.deferReply()
            await slashcmd.run({ client, interaction })

            const modcmd = client.commands.get(interaction.commandName)
            if (!modcmd) interaction.reply("Not a valid moderation command")

            await interaction.deferReply()
            await modcmd.run({ client, interaction })
        }
        handleCommand()
    })
    client.login(TOKEN)
}