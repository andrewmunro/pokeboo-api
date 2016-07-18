import request from 'request';

export default class PokeRequest
{
	constructor()
	{
		this.request = request.defaults({
			jar: true,
			headers: {
				'User-Agent': 'niantic'
			}
		});
	}

	get(url, options)
	{
		var promise = new Promise((resolve, reject) =>
		{
			this.request.get(url, options, (error, response, body) =>
			{
				resolve({ reponce: response, body: body });
			});
		});

		return promise;
	}

	post(url, options)
	{
		var promise = new Promise((resolve, reject) =>
		{
			this.request.post(url, options, (error, response, body) =>
			{
				resolve({ response: response, body: body });
			});
		});

		return promise;
	}
}