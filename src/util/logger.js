import winston from 'winston'
import 'winston-log2gelf'

const logTransports = []

// Log to console when running unit tests if CONSOLE_OUTPUT=true
if (process.env.CONSOLE_OUTPUT === 'true') {
    logTransports.push(new winston.transports.Console({ level: 'debug' }))
}

if (process.env.NODE_ENV !== 'test') {
    logTransports.push(new winston.transports.Console({ level: 'debug' }))
    logTransports.push(new winston.transports.File({
        level: 'error',
        filename: './logs/grappa.error.log'
    }))
}

if (process.env.LOG_PORT && process.env.LOG_HOST) {
    logTransports.push(new winston.transports.Log2gelf({
        hostname: process.env.LOG_HOSTNAME || 'grappa2-backend',
        host: process.env.LOG_HOST,
        port: process.env.LOG_PORT,
        protocol: 'http'
    }))
}

const logger = new winston.Logger({ transports: logTransports })

module.exports = logger
