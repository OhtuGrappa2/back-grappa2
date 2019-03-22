const logger = require('../util/logger')
const fs = require('fs')
const JSZip = require('jszip')
const axios = require('axios')

const { axiosErrorHandler } = require('../util/axiosErrorHandler')
const thesisService = require('../services/ThesisService')
const agreementService = require('../services/AgreementService')
const ethesisMetadataService = require('../services/EthesisMetadataService')
const {
    ETHESIS_USERNAME,
    ETHESIS_PASSWORD,
    ETHESIS_BASE_URL
} = require('../util/config')
const { FILE_UPLOAD_PATH } = require('../constants')

const ETHESIS_AUTHOR_DELIMITER = '|'

const flattenThesesMetadata = metadata => metadata.reduce((acc, cur) => {
    const { firstname, lastname } = cur
    const curObj = acc[cur.thesisId]
    if (!curObj) {
        acc[cur.thesisId] = Object.assign({}, cur, { author: `${lastname}, ${firstname}` })
    } else {
        acc[cur.thesisId] = Object.assign(curObj, {
            author: `${curObj.author}${ETHESIS_AUTHOR_DELIMITER}${lastname}, ${firstname}`
        })
    }
    return acc
}, {})

const checkAndUploadPendingTheses = async () => {
    logger.info('Starting thesis upload.')
    const theses = await thesisService.getPendingEthesisUploads()
    const thesesIds = theses.map(t => t.thesisId)
    const thesesMetadata = await agreementService.getThesisMetadataByIds(thesesIds)
    const flattenedMetadata = flattenThesesMetadata(thesesMetadata)
    const thesesWithMetadata = theses.reduce((acc, cur) => {
        if (acc[cur.thesisId] && acc[cur.thesisId].filename) {
            acc[cur.thesisId] = Object.assign(acc[cur.thesisId], cur)
        }
        return acc
    }, flattenedMetadata)

    await Promise.all(Object.values(thesesWithMetadata).map(async (metadata) => {
        const { thesisId, filename } = metadata
        try {
            await sendThesisToEthesis(metadata)
            await thesisService.setSentToEthesis(thesisId)
        } catch (err) {
            logger.error(`Sending thesis with filename ${filename} to ethesis failed.`)
            logger.error(err.message)
        }
    }))
}

const sendThesisToEthesis = async (metadata) => {
    const { filename, nameInFilesystem } = metadata
    const thesisPdf = await fs.readFileSync(`${FILE_UPLOAD_PATH}${nameInFilesystem}`)
    const metadataXml = await ethesisMetadataService.generateMetadataXml(metadata)
    const metadataFilename = 'mets.xml'

    const zip = new JSZip()
    zip.file(filename, thesisPdf)
    zip.file(metadataFilename, metadataXml)

    const url = `${ETHESIS_BASE_URL}/ethesis-sword/deposit/123456789/13`

    const auth = {
        username: ETHESIS_USERNAME,
        password: ETHESIS_PASSWORD
    }

    const headers = {
        'Content-Disposition': 'filename=ex.zip',
        'Content-Type': 'application/zip',
        'X-Packaging': 'http://purl.org/net/sword-types/METSDSpaceSIP',
        'X-No-Op': 'false',
        'X-Verbose': 'true'
    }

    const data = zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })

    try {
        await axios({
            method: 'POST',
            url,
            auth,
            data,
            headers
        })

        logger.info(`Uploaded ${filename} to ethesis collection in url: ${url}`)
    } catch (err) {
        throw axiosErrorHandler(err)
    }
}

module.exports = {
    checkAndUploadPendingTheses
}
