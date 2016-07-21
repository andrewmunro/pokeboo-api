'use strict';
import 'babel-polyfill';

import request from 'request';
import ProtoBuf from 'pokeboo-protobuf';

import RPCRequest from './request/RPCRequest';
import LoginRequest from './request/LoginRequest';

import logger from './logger/Logger';
import {decode} from './decorators/Decorators';

let RequestType = ProtoBuf.Networking.Requests.RequestType;
let Request = ProtoBuf.Networking.Requests.Request;

class PokeAPI {
    static LoginWithGoogle = LoginRequest.LoginWithGoogleAccount;
    static LoginWithPokemonClub = LoginRequest.LoginWithPokemonClub;

    constructor(token, expires, type, endpoint) {
        this.token = token;
        this.expires = expires;
        this.endpoint = endpoint;
        this.type = type;

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

    @decode(ProtoBuf.Networking.Responses.GetMapObjectsResponse)
    async getMapObjects() {
        return await this.rpc.post(this.endpoint, new Request(RequestType.GET_MAP_OBJECTS));
    }

    @decode(ProtoBuf.Networking.Responses.GetInventoryResponse)
    async getInventory() {
        return await this.rpc.post(this.endpoint, new Request(RequestType.GET_INVENTORY));
    }

    async setLocation(lat = 0, long = 0, altitude = 0) {
        this.location = { lat, long, altitude };

        await this.rpc.post(this.endpoint, new Request(RequestType.PLAYER_UPDATE));

        return this.location;
    }

    getLocation() {
        if(!this.location) {
            this.location = { latitude: 0, longitude: 0, altitude: 0 };
        }

        return this.location;
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
            this.api = await PokeAPI.Login();
            logger.info("Logged in!");

            try {
                let { playerData } = await this.api.getProfile();
                logger.info('Profile: ', playerData);
            } catch (e) {
                logger.error(e);
            }

        } catch(e) {
            logger.error(e);
        }
    }
}

new Playground();
