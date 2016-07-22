import protobufjs from 'protobufjs';
import ProtoBuf from 'pokeboo-protobuf';

export default class ProtoBufUtils {

    static enum(_class, value) {
        return protobufjs.Reflect.Enum.getName(_class, value);
    }

    static pokemonName(id)
    {
        return ProtoBufUtils.enum(ProtoBuf.Enums.PokemonId, id);
    }

    static moveName(id)
    {
        return ProtoBufUtils.enum(ProtoBuf.Enums.PokemonMove, id);
    }

    static moveName(id)
    {
        return ProtoBufUtils.enum(ProtoBuf.Enums.PokemonMove, id);
    }

    static itemName(id)
    {
        return ProtoBufUtils.enum(ProtoBuf.Inventory.ItemId, id);
    }

    static candyName(id)
    {
        return ProtoBufUtils.enum(ProtoBuf.Enums.PokemonFamilyId, id);
    }

    static teamName(id)
    {
        return ProtoBufUtils.enum(ProtoBuf.Enums.TeamColor, id);
    }

    
}