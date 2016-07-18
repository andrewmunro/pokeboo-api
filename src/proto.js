'use strict';
import 'babel-polyfill';

import request from 'request';
import url from 'url';
import querystring from 'querystring';
import ProtoBuf from 'protobufjs';

import {LOGIN, LOGIN_OAUTH} from './constants/urls';

const req = request.defaults({jar: true});
var builder = ProtoBuf.loadProtoFile('pokemon.proto');

var pokemonProto = builder.build()
var RequestEnvelop = pokemonProto.RequestEnvelop;
var ResponseEnvelop = pokemonProto.ResponseEnvelop;

class PokeAPI
{
    login(username, password)
    {
        console.log("Loggin...");
        let {error, response, body} = req(LOGIN, (error, response, body) => {
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
                    console.log("GOT AUTH");

                    console.log(auth.access_token);

                    console.log("REQUEST END POINT");

                    this.endPoint(auth.access_token, (responce) =>
                    {
                        var apiEndpoint = 'https://' + responce.api_url + '/rpc';
                        console.log("EndPoint: " + apiEndpoint);
                        this.getProfile(apiEndpoint, auth.access_token, (responce) =>
                        {
                            var profile = ResponseEnvelop.ProfilePayload.decode(responce.payload[0]).profile
                            console.log(JSON.stringify(profile));
                            console.log("USername:" + profile.username);
                        });
                    });


                    
                })
            });
        });
    }



    endPoint(accessToken, result)
    {
        var req = [
            new RequestEnvelop.Requests(2),
            new RequestEnvelop.Requests(126),
            new RequestEnvelop.Requests(4),
            new RequestEnvelop.Requests(129),
            new RequestEnvelop.Requests(5)
        ];

        this.apiRequest('https://pgorelease.nianticlabs.com/plfe/rpc', accessToken, req, result);
    }

    getProfile(endpoint, accessToken, result)
    {
        var req = new RequestEnvelop.Requests(2);

        this.apiRequest(endpoint, accessToken, req, result);
    }

    apiRequest(apiURL, accessToken, request, result)
    {
        var auth = new RequestEnvelop.AuthInfo({
            'provider': 'ptc',
            'token': new RequestEnvelop.AuthInfo.JWT(accessToken, 59)
        });

        var f_req = new RequestEnvelop({
            'unknown1': 2,
            'rpc_id': 1469378659230941192,

            'requests': request,

            'latitude': 0,
            'longitude': 0,
            'altitude': 0,

            'auth': auth,
            'unknown12': 989
        });

        var _protobuf = f_req.encode().toBuffer();

        var options = {
            url: apiURL,
            body: _protobuf,
            encoding: null,
            headers: {
                'User-Agent': 'Niantic App'
            }
        };

        console.log("");
        console.log("--> POST")
        console.log(options.url);

        req.post(options, (error, response, body) => {
            if (response === undefined || body === undefined || error != null) {
                console.error(error);
                throw error;
            }

            result(ResponseEnvelop.decode(body));
        });
    }
}

let api = new PokeAPI();
api.login('username', 'password');


