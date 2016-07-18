import GoogleOAuth from 'gpsoauthnode';
import url from 'url';
import querystring from 'querystring';

import PokeRequest from '../utils/PokeRequest';

export default class LoginSystem
{
	static async PokemonClub(username, password)
	{
		var request = new PokeRequest();

		var { body } = await request.get(LOGIN);
		var { lt, execution } = JSON.parse(body);

		var loginData = {
			lt,
			execution,
			'_eventId': 'submit',
			'username': username,
			'password': password
		};

		var { response } = await request.post(LOGIN, { form: loginData });

		var location = url.parse(response.headers.location, true);
		var ticket = location.query.ticket;

		var tokenData = {
			'client_id': 'mobile-app_pokemon-go',
			'redirect_uri': 'https://www.nianticlabs.com/pokemongo/error',
			'client_secret': 'w8ScCUXJQc6kXKw8FiOhd8Fixzht18Dq3PEVkUCP5ZPxtgyWsbTvWHFLm2wNY0JR',
			'grant_type': 'refresh_token',
			'code': ticket
		};

		var { body } = await request.post(LOGIN_OAUTH, { form: tokenData });

		let auth = querystring.parse(body);

		return auth;
	}

	static async GoogleAccount(username, password)
	{
		var promise = new Promise((resolve, reject) =>
		{
			var androidId = '9774d56d682e549c';
			var oauthService = 'audience:server:client_id:848232511240-7so421jotr2609rmqakceuu1luuq0ptb.apps.googleusercontent.com';
			var app = 'com.nianticlabs.pokemongo';
			var clientSig = '321187995bc7cdc2b5fc91b11a96e2baa8602c62';

			var google = new GoogleOAuth();

			google.login(username, password, androidId, function(err, data)
			{
				if (data)
				{
					google.oauth(username, data.masterToken, data.androidId, oauthService, app, clientSig, function(err, data)
					{
						resolve({
							access_token: data.Auth,
							expires: data.Expiry
						});
					});
				}
			});
		});

		return promise;
	}
}