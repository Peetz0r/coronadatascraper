import parseCsvSync from 'csv-parse/lib/sync';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';
import provincesMunicipailties from '../../vendor/nld-provinces.json';
import municipailtiesGeojson from '../../vendor/nld-municipalities.json';

const scraper = {
  country: 'NLD',
  maintainers: [maintainers.peetz0r],
  url: 'https://www.rivm.nl/actuele-informatie-over-coronavirus',
  type: 'csv',
  sources: [
    {
      name: 'RIVM',
      url: 'https://www.rivm.nl/actuele-informatie-over-coronavirus#mapContainer',
      description: 'RIVM: In het ziekenhuis opgenomen COVID-19 patiënten'
    },
    {
      name: 'CBS',
      url:
        'http://nationaalgeoregister.nl/geonetwork/srv/dut/catalog.search#/metadata/effe1ab0-073d-437c-af13-df5c5e07d6cd',
      description: 'CBS gebiedsindelingen: gemeentegrenzen'
    }
  ],
  async scraper() {
    const $ = await fetch.page(this.url);

    const input = parseCsvSync(
      $('#csvData')
        .text()
        .trim(),
      {
        delimiter: ';',
        columns: true,
        skip_empty_lines: true
      }
    );

    let output = [];

    for (const province in provincesMunicipailties) {
      if (Object.prototype.hasOwnProperty.call(provincesMunicipailties, province)) {
        const municipalities = [];

        for (const municipality of provincesMunicipailties[province]) {
          const m = input.find(e => parse.number(e.Gemnr) === municipality);
          municipalities.push({
            city: m.Gemeente,
            hospitalized: parse.number(m.Aantal),
            state: province,
            population: parse.number(m.BevAant),
            feature: municipailtiesGeojson.features.find(
              e => e.properties.statcode === `GM${String(municipality).padStart(4, '0')}`
            )
          });
        }

        output = output.concat(municipalities);
        output.push(
          transform.sumData(municipalities, {
            state: province,
            aggregate: 'city'
          })
        );
      }
    }
    return output;
  }
};

export default scraper;
