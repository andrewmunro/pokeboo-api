'use strict';
import 'babel-polyfill';

import request from 'request';


import ProtoBuf from 'pokeboo-protobuf';


import InventoryParser from './parser/InventoryParser';

import RPCRequest from './request/RPCRequest';
import LoginRequest from './request/LoginRequest';

import logger from './logger/Logger';
import {decode} from './decorators/Decorators';

import NodeGeocoder from 'node-geocoder';

import { LINQ } from 'node-linq';

import ByteBuffer from 'bytebuffer';
import s2 from 's2geometry-node';

import ProtoBufUtils from './utils/ProtoBufUtils';

let geocoder = NodeGeocoder({ provider: 'google' });

let RequestType = ProtoBuf.Networking.Requests.RequestType;
let Request = ProtoBuf.Networking.Requests.Request;

let GetMapObjectsMessage = ProtoBuf.Networking.Requests.Messages.GetMapObjectsMessage;
let FortDetailsMessage = ProtoBuf.Networking.Requests.Messages.FortDetailsMessage;
let FortDetailsResponse = ProtoBuf.Networking.Responses.FortDetailsResponse;

class PokeAPI {
    static LoginWithGoogle = LoginRequest.LoginWithGoogleAccount;
    static LoginWithPokemonClub = LoginRequest.LoginWithPokemonClub;

    constructor(token, expires, type, endpoint) {
        this.token = token;
        this.expires = expires;
        this.endpoint = endpoint;
        this.type = type;

        this.location = { latitude: 0, longitude: 0, altitude: 0 };

        this.rpc = new RPCRequest(this.token, type, this.getLocation.bind(this));
    }

    static async Login(username, password, loginMethod = PokeAPI.LoginWithPokemonClub) {
        let { access_token:token, expires } = await loginMethod.call(null, username, password);

        let request = [
            new Request(2),//GET_PLAYER
            new Request(126), //GET_HATCHED_EGGS
            new Request(4), //GET_INVENTORY
            new Request(129), //CHECK_AWARDED_BADGES
            new Request(5) //DOWNLOAD_SETTINGS
        ];

        let type = loginMethod === PokeAPI.LoginWithPokemonClub ? 'ptc' : 'google';
        let { apiUrl } = await new RPCRequest(token, type).post('https://pgorelease.nianticlabs.com/plfe/rpc', request);

        return new PokeAPI(token, expires, type, `https://${apiUrl}/rpc`);
    }

    @decode(ProtoBuf.Networking.Responses.GetPlayerResponse)
    async getProfile() {
        return await this.rpc.post(this.endpoint, new Request(RequestType.GET_PLAYER));
    }

    @decode(ProtoBuf.Networking.Responses.GetHatchedEggsResponse)
    async getHatchedEggs() {
        return await this.rpc.post(this.endpoint, new Request(RequestType.GET_HATCHED_EGGS));
    }

    // @decode dosn't work with args?!
    async getFortDetails(id, long, lat) {
        var details = new FortDetailsMessage(id, long, lat);
        var result = await this.rpc.post(this.endpoint, new Request(RequestType.FORT_DETAILS, details.encode()));

        return FortDetailsResponse.decode(result.returns[0]);
    }

    @decode(ProtoBuf.Networking.Responses.GetMapObjectsResponse)
    async getMapObjects() {

        var nullbytes = new Buffer(21);
        nullbytes.fill(0);

        // Generating walk data using s2 geometry
        var walk = this.getNeighbors(this.location.latitude, this.location.longitude).sort((a, b) => {
            return a > b;
        });

        var buffer = new ByteBuffer(21 * 10).LE();
        walk.forEach(function (elem) {
            buffer.writeVarint64(elem);
        });

        // Creating MessageQuad for Requests type=106
        buffer.flip();

        var message = new GetMapObjectsMessage(buffer, nullbytes, this.location.latitude, this.location.longitude).encode();

        return await this.rpc.post(this.endpoint, new Request(RequestType.GET_MAP_OBJECTS, message));
    }

    @decode(ProtoBuf.Networking.Responses.GetInventoryResponse)
    async getInventory() {
        return await this.rpc.post(this.endpoint, new Request(RequestType.GET_INVENTORY));
    }

    setLocation(latitude = 0, longitude = 0, altitude = 0) {

        this.location.latitude = latitude;
        this.location.longitude = longitude;
        this.location.altitude = altitude;

        return this.location;
    }

    getLocation() {
        return this.location;
    }

    getNeighbors(lat, lng) {

        var origin = new s2.S2CellId(new s2.S2LatLng(lat, lng)).parent(15);

        var walk = [origin.id()];

        // 10 before and 10 after
        var next = origin.next();
        var prev = origin.prev();

        for (var i = 0; i < 10; i++) {
            // in range(10):
            walk.push(prev.id());
            walk.push(next.id());
            next = next.next();
            prev = prev.prev();
        }

        return walk;
    }
}

class Playground {
    constructor() {
        try {
            this.run();
        }
        catch (e) {
            logger.error(e, e.stack);
        }
    }



    async run() {
        try {
            logger.info("Logging in...");
            this.api = await PokeAPI.Login("", "", PokeAPI.LoginWithGoogle);
            logger.info("Logged in!");

            try {

                var locations = await geocoder.geocode("Wellington Street, Leeds");

                var location = locations[0];

                this.api.setLocation(location.latitude, location.longitude, 0);

                let { playerData } = await this.api.getProfile();

                logger.info('Profile: ', playerData);

                let inventory = InventoryParser.parse(await this.api.getInventory());

                var pokemon = new LINQ(inventory.pokemon)
                    .OrderBy((pokemon) => pokemon.stats.cp)
                    .Reverse()
                    .Select((pokemon) => "Name: " + pokemon.name + "\t  CP: " + pokemon.stats.cp)
                    .ToArray()
                    .slice(0, 6);

                logger.info("Top 6 Pokemon");
                pokemon.forEach((item) => logger.info(item));

                logger.info("");
                logger.info("Inventory");
                logger.info(inventory.items);

                let result = await this.api.getMapObjects();

                for(var cell of result.mapCells)
                {
                    if(cell.nearbyPokemons)
                    {
                        for(var pokemon of cell.nearbyPokemons)
                        {
                            var pokemonName = ProtoBufUtils.pokemonName(pokemon.pokemonId);

                            console.log("Name: " + pokemonName + " Distance: " + pokemon.distanceInMeters);
                        }
                    }

                    if(cell.forts)
                    {
                        for(var fort of cell.forts)
                        {
                            var details = await this.api.getFortDetails(fort.id, fort.longitude, fort.latitude);

                            if(fort.type == null)
                            {
                                var teamName = ProtoBufUtils.teamName(fort.ownedByTeam);
                                var pokemonName = ProtoBufUtils.pokemonName(fort.guardPokemonId);

                                console.log("Gym '" + details.name + "' owned by " + teamName + " guarded by " + pokemonName);
                            }
                            else
                            {
                                console.log("Pokestop '" + details.name + "' Lure " + (details.modifiers.length > 0));
                            }
                        }
                    }
                }

            } catch (e) {
                logger.error(e);
            }

        } catch(e) {
            logger.error(e);
        }
    }
}

new Playground();
