import request from 'request';
import ProtoBuf from 'pokeboo-protobuf';

let RequestEnvelope = ProtoBuf.Networking.Envelopes.RequestEnvelope;
let ResponseEnvelope = ProtoBuf.Networking.Envelopes.ResponseEnvelope;

export default class RPCRequest {
    constructor(accessToken, type, getLocation) {
        this.accessToken = accessToken;
        this.getLocation = getLocation || (() => ({latitude: 0, longitude: 0, altitude: 0}));



        this.request = request.defaults({
            jar: true,
            encoding: null,
            headers: {
                'User-Agent': 'Niantic App'
            }
        });

        this.auth = new RequestEnvelope.AuthInfo({
            'provider': type,
            'token': new RequestEnvelope.AuthInfo.JWT(this.accessToken, 59)
        });
    }

    post(url, requests) {

        let { latitude, longitude, altitude } = this.getLocation();

        return new Promise((resolve, reject) => {

            let data = new RequestEnvelope({
                statusCode: 2,
                requestId: 1469378659230941192,
                requests,
                latitude,
                longitude,
                altitude,
                authInfo: this.auth,
                unknown12: 989
            });

            let options = {
                url: url,
                body: data.encode().toBuffer()
            };

            this.request.post(options, (error, response, body) => {
                if (response === undefined || body === undefined || error != null) {
                    return reject(error);
                }

                resolve(ResponseEnvelope.decode(body));
            });
        });
    }
}
