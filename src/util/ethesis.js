import axios from 'axios'
import xml from 'xmlbuilder'
import creds from './ethesis_credentials'
import FormData from 'form-data'

export function getExamplePDF(){
    const fs = require('fs');
    return fs.readFileSync('./data/file/example_thesis.pdf');
}

export async function saveToEThesis(meta, pdf){

    const auth_config = { 'auth': creds };
    const config = {headers: {'X-Requested-With': 'XMLHttpRequest'}};
    
    var metaData = xml.create({
        entry: {
            '@xmlns': 'http://www.w3.org/2005/Atom',
            '@xmlns:sword': 'http://purl.org/net/sword/',
            title: 'harjoittelusyöttö',
            author:{
                name: {
                '#text': 'harjoittelusyöttö'
                }
            },
            summary:{
                '@type': 'text',
                '#text': 'The abstract'
            },
            'dcterms:abstract': 'The abstract',
            'dcterms:accessRights': 'Access Rights',
            'dcterms:alternative': 'Alternative Title',
            'dcterms:available': 'Date Available',
            'dcterms:bibliographicCitation': 'Bibliographic Citation',
            'dcterms:contributor': 'Contributor',
            'dcterms:description': 'Description',
            'dcterms:hasPart': 'Has Part',
            'dcterms:hasVersion': 'Has Version',
            'dcterms:identifier': 'Identifier',
            'dcterms:isPartOf': 'Is Part Of',
            'dcterms:publisher': 'Publisher',
            'dcterms:references': 'References',
            'dcterms:rightsHolder': 'Rights Holder',
            'dcterms:source': 'Source',
            'dcterms:title': 'Title',
            'dcterms:type': 'Type'
        }
      }).end({ pretty: true});
    
    console.log(metaData.toString());
    console.log('--- --- ---')
    
    const data = new FormData();
    data.append('meta', metaData, { type: 'application/atomserv+xml' });
    console.log(pdf);
    //data.append('file', pdf, { type: 'application/pdf' });

    axios.post('http://kirjasto-test.hulib.helsinki.fi/ethesis-swordv2/collection/123456789/13', data, auth_config, config)
    .then(
        (response) => {
            console.log(response)
        }
    ).catch(
        (errors) => {
            console.log('--- --- ---');
            console.log('--- --- REQUEST HEADERS --- ---');
            console.log(errors.request._header);
            console.log('--- --- FULL REQUEST --- ---');
            console.log(errors.request);
            console.log('--- --- RESPONSE STATUS --- ---');
            console.log(errors.response.status);
            console.log('--- --- RESPONSE TEXT --- ---');
            console.log(errors.response.statusText);
            console.log('--- --- RESPONSE MESSAGE --- ---');
            console.log(errors.response.message);
            console.log('--- --- RESPONSE HEADERS --- ---');
            console.log(errors.response.headers);
            console.log('--- --- RESPONSE CONFIG --- ---');
            console.log(errors.response.config);
        }
    );

}