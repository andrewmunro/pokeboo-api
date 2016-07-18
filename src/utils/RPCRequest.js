import request from 'request';
import ProtoBuf from 'protobufjs';

var builder = ProtoBuf.loadProtoFile('pokemon.proto');

var pokemonProto = builder.build()
var RequestEnvelop = pokemonProto.RequestEnvelop;
var ResponseEnvelop = pokemonProto.ResponseEnvelop;

export default class RPCRequest
{
	constructor(accessToken)
	{
		this.accessToken = accessToken;

		this.request = request.defaults({
			jar: true,
			encoding: null,
			headers: {
				'User-Agent': 'Niantic App'
			}
		});

		this.auth = new RequestEnvelop.AuthInfo({
			'provider': 'google', //google / ptc
			'token': new RequestEnvelop.AuthInfo.JWT(this.accessToken, 59)
		});
	}

	post(url, request)
	{
		var promise = new Promise((resolve, reject) =>
		{
			var data = new RequestEnvelop({
				'unknown1': 2,
				'rpc_id': 1469378659230941192,

				'requests': request,

				// Need pulling out?
				'latitude': 0,
				'longitude': 0,
				'altitude': 0,

				'auth': this.auth,
				'unknown12': 989
			});

			var options = {
				url: url,
				body: data.encode().toBuffer()
			};

			this.request.post(options, (error, response, body) => {
				if (response === undefined || body === undefined || error != null) {
					reject(error);
				}

				resolve(ResponseEnvelop.decode(body));
			});
		});

		return promise;
	}
}