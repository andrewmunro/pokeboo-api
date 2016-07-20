'use strict';
import 'babel-polyfill';

import request from 'request';
import ProtoBuf from 'pokeboo-protobuf';

import RPCRequest from './request/RPCRequest';
import LoginRequest from './request/LoginRequest';

import {decode} from './utils/Decorators';

//let GetPlayerResponse = pokemonProto.Networking.Responses.GetPlayerResponse;
//let GetInventoryResponse = pokemonProto.Networking.Responses.GetInventoryResponse;
//let GetHatchedEggsResponse = pokemonProto.Networking.Responses.GetHatchedEggsResponse;
//let GetMapObjectsResponse = pokemonProto.Networking.Responses.GetMapObjectsResponse;


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

        this.rpc = new RPCRequest(this.token, type);
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

        let type = PokeAPI.LoginWithPokemonClub ? 'ptc' : 'google';

        let { apiUrl } = await new RPCRequest(token, type).post('https://pgorelease.nianticlabs.com/plfe/rpc', request);

        return new PokeAPI(token, expires, type, `https://${apiUrl}/rpc`);
    }

    @decode(ProtoBuf.Networking.Responses.GetPlayerResponse)
    async getProfile() {
        return await this.rpc.post(this.endpoint, new Request(RequestType.GET_PLAYER));
    }

    async getHatchedEggs() {
        let request = new Request(RequestType.GET_HATCHED_EGGS);

        let result = await this.rpc.post(this.endpoint, request);

        let profile = GetHatchedEggsResponse.decode(result.returns[0]);

        return profile;
    }

    async getMapObjects() {
        let request = new Request(RequestType.GET_MAP_OBJECTS);

        let result = await this.rpc.post(this.endpoint, request);

        let profile = GetMapObjectsResponse.decode(result.returns[0]);

        return profile;
    }

    async getInventory() {
        let request = new Request(RequestType.GET_INVENTORY);

        let result = await this.rpc.post(this.endpoint, request);

        let inventory = GetInventoryResponse.decode(result.returns[0]);

        return inventory;
    }
}

class Playground {
    constructor() {
        try {
            this.run();
        }
        catch (e) {
            console.error(e);
        }
    }

    async run() {
        console.log("Logging in...");

        try {
            this.api = await PokeAPI.Login();
        } catch(e) {
            console.log(e);
            console.log(e.stack);
        }

        console.log("Logged in!");

        try {
            let profile = await this.api.getProfile();
        } catch (e) {
            console.log(e);
            console.log(e.stack);
        }

        let debug = {
            token: this.api.token != null,
            endpoint: this.api.endpoint,
            name: profile.username,
            team: profile.team,
            stardust: profile.currencies[1].amount,
            tutorial: profile.tutorialState
        };

        console.log(debug);
        //
        //let eggs = await this.api.getHatchedEggs();
        //console.log(eggs);
        //
        //let map = await this.api.getMapObjects();
        //console.log(map);
        //
        //let inventory = await this.api.getInventory();
        //
        //console.log(inventory);
    }
}

new Playground();
