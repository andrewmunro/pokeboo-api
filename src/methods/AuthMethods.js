import request from 'request';
import url from 'url';
import querystring from 'querystring';

import {LOGIN, LOGIN_OAUTH} from '../constants/urls';

const req = request.defaults({jar: true});

class AuthMethods {
    async login(username, password) {
        return new Promise((resolve, reject) => {
            req(LOGIN, (error, response, body) => {
                if(error) return reject(error);

                let { lt, execution } = JSON.parse(body);

                req.post({
                    url: LOGIN,
                    headers: {
                        'User-Agent': 'niantic'
                    },
                    form: {
                        lt,
                        execution,
                        '_eventId': 'submit',
                        'username': username,
                        'password': password
                    }
                }, (error, response, body) => {
                    if(error) return reject(error);

                    if(!response.headers.location) {
                        return reject(new Error('No login ticket in response from Pokemon Go Servers. Are they down :( ?'))
                    }

                    let location = url.parse(response.headers.location, true);
                    let ticket = location.query.ticket;

                    req.post({
                        url: LOGIN_OAUTH,
                        headers: {
                            'User-Agent': 'niantic'
                        },
                        form: {
                            'client_id': 'mobile-app_pokemon-go',
                            'redirect_uri': 'https://www.nianticlabs.com/pokemongo/error',
                            'client_secret': 'w8ScCUXJQc6kXKw8FiOhd8Fixzht18Dq3PEVkUCP5ZPxtgyWsbTvWHFLm2wNY0JR',
                            'grant_type': 'refresh_token',
                            'code': ticket
                        }
                    }, (error, response, body) => {
                        let auth = querystring.parse(body);

                        return resolve(auth);
                    })
                });
            });
        });
    }
}

export default new AuthMethods();
