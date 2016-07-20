'use strict';
import 'babel-polyfill';

import request from 'request';

import ProtoBuf from 'protobufjs';


import RPCRequest from './utils/RPCRequest';
import LoginSystem from './login/LoginSystem';




var builder = ProtoBuf.loadProtoFile('pokemon.proto');

var pokemonProto = builder.build();
var Request = pokemonProto.Networking.Requests.Request;
var GetPlayerResponse = pokemonProto.Networking.Responses.GetPlayerResponse;
var GetInventoryResponse = pokemonProto.Networking.Responses.GetInventoryResponse;
var GetHatchedEggsResponse = pokemonProto.Networking.Responses.GetHatchedEggsResponse;
var GetMapObjectsResponse = pokemonProto.Networking.Responses.GetMapObjectsResponse;


var RequestType = pokemonProto.Networking.Requests.RequestType;

class PokeAPI
{
	async login(username, password, type)
	{
		var result = null;

		// Use consts
		if(type == 'ptc') result = await LoginSystem.PokemonClub(username, password);
		if(type == 'google') result = await LoginSystem.GoogleAccount(username, password);

		this.token = result.access_token;
		this.expires  = result.expires;

		this.rpc = new RPCRequest(this.token, type);

		this.endpoint = await this.getEndpoint();
	}

	async getEndpoint()
	{
		var request = [
			new Request(2),//GET_PLAYER
			new Request(126), //GET_HATCHED_EGGS
			new Request(4), //GET_INVENTORY
			new Request(129), //CHECK_AWARDED_BADGES
			new Request(5) //DOWNLOAD_SETTINGS
		];

		
		var result = await this.rpc.post('https://pgorelease.nianticlabs.com/plfe/rpc', request);

		return 'https://' + result.api_url + '/rpc';
	}

	async getProfile()
	{
		var request = new Request(RequestType.GET_PLAYER);

		var result = await this.rpc.post(this.endpoint, request);
		
		var profile = GetPlayerResponse.decode(result.returns[0]);

		return profile.local_player;
	}

	async getHatchedEggs()
	{
		var request = new Request(RequestType.GET_HATCHED_EGGS);

		var result = await this.rpc.post(this.endpoint, request);

		var profile = GetHatchedEggsResponse.decode(result.returns[0]);

		return profile;
	}

	 async getMapObjects()
	{
		var request = new Request(RequestType.GET_MAP_OBJECTS);

		var result = await this.rpc.post(this.endpoint, request);

		var profile = GetMapObjectsResponse.decode(result.returns[0]);

		return profile;
	}

	async getInventory()
	{
		var request = new Request(RequestType.GET_INVENTORY);

		var result = await this.rpc.post(this.endpoint, request);

		var inventory = GetInventoryResponse.decode(result.returns[0]);

		return inventory;
	}
}

class Playground
{
	constructor()
	{
		this.api = new PokeAPI();

		try
		{
			this.run();
		}
		catch(e)
		{
			console.error(e);
		}
	}

	async run()
	{
		console.log("LOggin in...");

		// await this.api.login('', '', 'google');
		// await this.api.login('', '', 'ptc');

		var profile = await this.api.getProfile();

		var debug =  {
			token: this.api.token != null,
			endpoint: this.api.endpoint,
			name: profile.username,
			team: profile.team,
			stardust: profile.currencies[1].amount,
			tutorial: profile.tutorial_state
		}

		console.log(debug);

		var eggs = await this.api.getHatchedEggs()
		console.log(eggs);

		var map = await this.api.getMapObjects();
		console.log(map);

		var inventory = await this.api.getInventory();	

		console.log(inventory);
	}
}

new Playground();