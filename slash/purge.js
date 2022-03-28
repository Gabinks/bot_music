const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Purge an amount of message')
    .addIntegerOption((option) => {
        return option
        .setName('amount')
        .setDescription('Amount of message to delete')
        .setRequired(true)
    }),
    async execute(client, interaction) {
        if(!interaction.member.permissions.has('MANAGE_MESSAGES')) return interaction.reply({ content: "You don't have have `MANAGE_MESSAGES` permission to use this command!"})

        if(interaction.guild.me.permissions.has('MANAGE_MESSAGES')) return interaction.reply({ content: "I don't have have `MANAGE_MESSAGES` permission to execute this command!"})

        let amount = interaction.options.getInteger('amount')
    
        if(isNaN(amount)) {
            return interaction.reply({ content: '**Please specify a valid amount between 1 - 100!**', ephemeral: true})
        }

        if(parseInt(amount) > 99) {
            return interaction.reply({ content: '**I can only delete 99 messages once!', ephemeral: true})
        } else {
            try{
            let { size } = await interaction.channel.bulkDelete(amount)
            await interaction.reply({ content: `Deleted ${size} messages`, ephemeral: true})
            } catch(e) {
                console.lo
                interaction.reply({ content: `I cannot delete messages that is older than 14 days.`, ephemeral: true})
            }
        }
    }
}