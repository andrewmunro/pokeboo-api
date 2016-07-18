'use strict';
import 'babel-polyfill';

import request from 'request';

import ProtoBuf from 'protobufjs';


import RPCRequest from './utils/RPCRequest';
import LoginSystem from './login/LoginSystem';

import { LOGIN, LOGIN_OAUTH } from './constants/urls';


var builder = ProtoBuf.loadProtoFile('pokemon.proto');

var pokemonProto = builder.build()
var RequestEnvelop = pokemonProto.RequestEnvelop;
var ResponseEnvelop = pokemonProto.ResponseEnvelop;

class PokeAPI
{
	async login(username, password, type)
	{
		var result = null;

		// Use consts
		if(type == 'ptc') result = await LoginSystem.PokemonClub(username, password);
		if(type == 'google') result =await LoginSystem.GoogleAccount(username, password);

		this.token = result.access_token;
		this.expires  = result.expires;

		this.rpc = new RPCRequest(this.token);

		// Should this be in login?
		this.endpoint = await this.getEndpoint();
	}

	async getEndpoint()
	{
		var request = [
			new RequestEnvelop.Requests(2),
			new RequestEnvelop.Requests(126),
			new RequestEnvelop.Requests(4),
			new RequestEnvelop.Requests(129),
			new RequestEnvelop.Requests(5)
		];

		var result = await this.rpc.post('https://pgorelease.nianticlabs.com/plfe/rpc', request);

		return 'https://' + result.api_url + '/rpc';
	}

	async getProfile()
	{
		var request = new RequestEnvelop.Requests(2);

		var result = await this.rpc.post(this.endpoint, request);

		var profile = ResponseEnvelop.ProfilePayload.decode(result.payload[0]).profile;

		return profile;
	}
}

class Playground
{
	constructor()
	{
		this.api = new PokeAPI();

		this.run();
	}

	async run()
	{
		await this.api.login('', '', 'google');

		var profile = await this.api.getProfile();

		var debug =  {
			token: this.api.token != null,
			endpoint: this.api.endpoint,
			name: profile.username,
			team: profile.team,
			stardust: profile.currency[1].amount
		}

		console.log(debug);
	}
}

new Playground();