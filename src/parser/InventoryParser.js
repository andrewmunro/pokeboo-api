import ProtoBufUtils from './../utils/ProtoBufUtils';

import logger from './../logger/Logger';

export default class InventoryParser {

    static parsePokemon(data)
    {
        return {
            id: data.pokemonId,
            name: ProtoBufUtils.pokemonName(data.pokemonId),
            nickname: data.nickname,
            stats: {
                cp: data.cp,
                stamina: data.stamina,
                staminaMax: data.staminaMax,
                height: data.heightM,
                weight: data.weightKg
            },
            moves: [
                ProtoBufUtils.moveName(data.move_1),
                ProtoBufUtils.moveName(data.move_2)
            ]
        }
    }

    static parseItem(data)
    {
        return { 
            id: ProtoBufUtils.itemName(data.itemId),
            quantity: data.count
        };
    }

    static parseCandy(data)
    {
        return { 
            id: ProtoBufUtils.candyName(data.familyId),
            quantity: data.candy
        };
    }

    static parse(inventoryResponce)
    {
        let inventoryItems = inventoryResponce.inventoryDelta.inventoryItems;

        var inventory = {
            pokemon: [],
            items: [],
            candy: [],
            playerStats: {},
        }
                
        for(var inventoryItem of inventoryItems)
        {
            var item = inventoryItem.inventoryItemData;

            if(item.pokemonData)        inventory.pokemon.push(InventoryParser.parsePokemon(item.pokemonData));
            else if(item.item)          inventory.items.push(InventoryParser.parseItem(item.item));
            else if(item.pokemonFamily) inventory.candy.push(InventoryParser.parseCandy(item.pokemonFamily));
            else if(item.playerStats) {
                inventory.playerStats = item.playerStats;
                inventory.playerStats.pokemonCaughtByType = null;
            }
            else if(item.pokedexEntry) {
            } else {
                // logger.info("Pokemon: " + JSON.stringify(item, null, '\t'));
            }
        }

        return inventory;
    }
}