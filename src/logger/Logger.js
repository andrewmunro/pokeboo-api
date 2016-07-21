import bunyan from 'bunyan';
import bunyanDebugStream from 'bunyan-debug-stream';

class Logger {
    constructor() {
        this.logger = bunyan.createLogger({
            name: 'pokeboo-api',
            streams: [
                {
                    level: 'debug',
                    type: 'raw',
                    stream: bunyanDebugStream({
                        basepath: __dirname,
                        forceColor: true
                    })
                }
            ],
            serializers: bunyanDebugStream.serializers
        });
    }

    info() {
        this.logger.info(...arguments);
    }

    debug() {
        this.logger.debug(...arguments);
    }

    error() {
        this.logger.error(...arguments);
    }

    warn() {
        this.logger.warn(...arguments);
    }
}

export default new Logger;