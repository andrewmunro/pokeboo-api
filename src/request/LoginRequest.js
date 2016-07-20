import GoogleOAuth from 'gpsoauthnode';
import url from 'url';
import querystring from 'querystring';

import { LOGIN, LOGIN_OAUTH } from '../constants/urls';
import PokeRequest from './PokeRequest';

export default class LoginRequest {
    static async LoginWithPokemonClub(username, password) {
        let request = new PokeRequest();

        let { body } = await request.get(LOGIN);

        let { lt, execution } = JSON.parse(body);

        let loginData = {
            lt,
            execution,
            '_eventId': 'submit',
            'username': username,
            'password': password
        };

        let { response } = await request.post(LOGIN, {form: loginData});

        let location = url.parse(response.headers.location, true);
        let ticket = location.query.ticket;

        let tokenData = {
            'client_id': 'mobile-app_pokemon-go',
            'redirect_uri': 'https://www.nianticlabs.com/pokemongo/error',
            'client_secret': 'w8ScCUXJQc6kXKw8FiOhd8Fixzht18Dq3PEVkUCP5ZPxtgyWsbTvWHFLm2wNY0JR',
            'grant_type': 'refresh_token',
            'code': ticket
        };

        let {body:auth} = await request.post(LOGIN_OAUTH, {form: tokenData});

        return querystring.parse(auth);
    }

    static LoginWithGoogleAccount(username, password) {
        return new Promise((resolve, reject) => {
            let androidId = '9774d56d682e549c';
            let oauthService = 'audience:server:client_id:848232511240-7so421jotr2609rmqakceuu1luuq0ptb.apps.googleusercontent.com';
            let app = 'com.nianticlabs.pokemongo';
            let clientSig = '321187995bc7cdc2b5fc91b11a96e2baa8602c62';

            let google = new GoogleOAuth();

            google.login(username, password, androidId, (err, { masterToken, androidId }) => {
                if (err) {
                    return reject(err);
                }

                google.oauth(username, masterToken, androidId, oauthService, app, clientSig, (err, { auth:Auth, expiry:Expiry }) => {
                    if (err) {
                        return reject(err);
                    }

                    resolve({
                        access_token: auth,
                        expires: expiry
                    });
                });
            });
        });
    }
}