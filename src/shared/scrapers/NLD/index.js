import parseCsvSync from 'csv-parse/lib/sync';
import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';

const scraper = {
  country: 'NLD',
  maintainers: [maintainers.peetz0r],
  url: 'https://www.rivm.nl/coronavirus-kaart-van-nederland-per-gemeente',
  type: 'csv',
  sources: [
    {
      name: 'RIVM',
      url: 'https://www.rivm.nl/coronavirus-kaart-van-nederland-per-gemeente',
      description: 'RIVM: Coronavirus kaart van Nederland per gemeente'
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
    const provincesMunicipailties = {
      Drenthe: [1680, 106, 1681, 109, 114, 118, 119, 1731, 1699, 1730, 1701, 1690],
      Flevoland: [34, 303, 995, 171, 184, 50],
      Friesland: [59, 60, 1891, 1940, 72, 74, 80, 1970, 85, 86, 88, 90, 1900, 93, 737, 96, 1949, 98],
      Gelderland: [
        197,
        200,
        202,
        203,
        1945,
        1859,
        209,
        1876,
        213,
        214,
        216,
        221,
        222,
        225,
        226,
        228,
        230,
        232,
        233,
        243,
        244,
        246,
        252,
        1705,
        262,
        263,
        1955,
        1740,
        267,
        268,
        302,
        269,
        1586,
        1509,
        1734,
        273,
        274,
        275,
        277,
        279,
        281,
        285,
        289,
        1960,
        668,
        293,
        296,
        294,
        297,
        299,
        301
      ],
      Groningen: [3, 10, 14, 1966, 24, 1952, 1895, 765, 37, 47, 1969, 1950],
      Limburg: [
        888,
        1954,
        889,
        893,
        899,
        1711,
        1903,
        907,
        1729,
        917,
        1507,
        928,
        882,
        1640,
        1641,
        935,
        938,
        944,
        946,
        1894,
        1669,
        957,
        965,
        1883,
        971,
        981,
        994,
        983,
        984,
        986,
        988
      ],
      'Noord-Brabant': [
        1723,
        1959,
        743,
        744,
        1724,
        748,
        1721,
        753,
        1728,
        755,
        756,
        757,
        758,
        1706,
        1684,
        762,
        766,
        1719,
        770,
        772,
        777,
        779,
        1771,
        1652,
        784,
        785,
        786,
        788,
        1655,
        1658,
        794,
        796,
        797,
        798,
        1659,
        1685,
        809,
        1948,
        815,
        1709,
        820,
        823,
        824,
        826,
        828,
        1667,
        1674,
        840,
        1702,
        845,
        847,
        848,
        851,
        855,
        856,
        858,
        861,
        865,
        866,
        867,
        873,
        879
      ],
      'Noord-Holland': [
        358,
        361,
        362,
        363,
        370,
        373,
        375,
        376,
        377,
        383,
        384,
        498,
        385,
        388,
        1942,
        392,
        394,
        396,
        397,
        398,
        399,
        400,
        402,
        1911,
        405,
        406,
        1598,
        415,
        416,
        417,
        420,
        431,
        432,
        437,
        439,
        441,
        532,
        448,
        450,
        451,
        453,
        852,
        457,
        1696,
        880,
        479,
        473
      ],
      Overijssel: [
        141,
        147,
        148,
        150,
        1774,
        153,
        158,
        160,
        163,
        164,
        1735,
        166,
        168,
        173,
        1773,
        175,
        177,
        1742,
        180,
        1708,
        183,
        1700,
        189,
        1896,
        193
      ],
      Utrecht: [
        307,
        308,
        310,
        312,
        313,
        317,
        321,
        353,
        327,
        331,
        335,
        356,
        589,
        339,
        340,
        736,
        342,
        1904,
        344,
        1581,
        345,
        1961,
        352,
        632,
        351,
        355
      ],
      Zeeland: [654, 664, 677, 678, 687, 1695, 703, 1676, 1714, 715, 716, 717, 718],
      'Zuid-Holland': [
        482,
        613,
        484,
        489,
        1901,
        501,
        502,
        503,
        505,
        1924,
        512,
        513,
        518,
        523,
        530,
        531,
        534,
        1963,
        1884,
        537,
        542,
        1931,
        1621,
        546,
        547,
        1916,
        553,
        556,
        1842,
        1978,
        569,
        1930,
        575,
        579,
        590,
        1926,
        597,
        603,
        599,
        606,
        610,
        1525,
        622,
        626,
        627,
        629,
        1783,
        614,
        637,
        638,
        1892,
        642
      ]
    };

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

    const m = input.find(e => parse.number(e.Gemnr) === -1);

    let output = [
      {
        state: '(unassigned)',
        cases: parse.number(m.Gemeente.match(/(\d+)/)[0])
      }
    ];

    for (const province in provincesMunicipailties) {
      if (Object.prototype.hasOwnProperty.call(provincesMunicipailties, province)) {
        const municipalities = [];

        for (const municipality of provincesMunicipailties[province]) {
          const m = input.find(e => parse.number(e.Gemnr) === municipality);
          municipalities.push({
            city: m.Gemeente,
            cases: parse.number(m.Aantal),
            state: province,
            population: parse.number(m.BevAant)
          });
        }

        output = output.concat(municipalities);
        output.push(
          transform.sumData(municipalities, {
            state: province
          })
        );
      }
    }
    console.log(output);
    return output;
  }
};

export default scraper;
