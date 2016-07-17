'use strict';
import 'babel-polyfill';

import {requiresAuth} from './utils/Decorators';
import authMethods from './methods/AuthMethods';
import locationMethods from './methods/LocationMethods';

class PokeAPI {
    async login(username, password) {
        let { access_token, expires } = await authMethods.login();

        this.token = access_token;
        this.expires = expires;

        return this.token;
    }

    @requiresAuth
    async getLocation() {
        let location = await locationMethods.getLocation();
        return location;
    }

    @requiresAuth
    async setLocation(locationQuery) {
        let location = await locationMethods.setLocation(locationQuery);
        return location;
    }
}

let demo = async () => {
    try {
        let api = new PokeAPI();
        await api.login('username', 'password');
        let location = await api.setLocation('Eiffel Tower');
        console.log(location);
    } catch(e) {
        console.log(e);
    }
};

demo();
