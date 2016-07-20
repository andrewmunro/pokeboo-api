import request from 'request';
import ProtoBuf from 'protobufjs';

var builder = ProtoBuf.loadProtoFile('pokemon.proto');
var pokemonProto = builder.build();
var RequestEnvelope = pokemonProto.Networking.Envelopes.RequestEnvelope;
var ResponseEnvelope = pokemonProto.Networking.Envelopes.ResponseEnvelope;



export default class RPCRequest
{
	constructor(accessToken, type)
	{
		this.accessToken = accessToken;

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

	post(url, request)
	{
		var promise = new Promise((resolve, reject) =>
		{

			var data = new RequestEnvelope({
				'status_code': 2,
				'request_id': 1469378659230941192,

				'requests': request,

				// Need pulling out?
				'latitude': 0,
				'longitude': 0,
				'altitude': 0,

				'auth_info': this.auth,
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

				resolve(ResponseEnvelope.decode(body));
			});
		});

		return promise;
	}
}