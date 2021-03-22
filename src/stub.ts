import App from "./App";


const data_json: string = '{"data": [ ' +
    '{' +
     '   "type": "graph", ' +
      '  "value": { ' +
       '     "vertices": [ ' +
        '        "1", ' +
         '       "2",' +
          '      "3",' +
           '     "4",' +
            '    "5"' +
            '],' +
            '"edges": [' +
             '   {' +
              '      "source": "1", ' +
               '     "target": "2",' +
                '    "isDirected": "true"' +

                '},' +
                '{' +
                 '   "source": "2", ' +
                  '  "target": "3",' +
                   ' "isDirected": "true"' +

                '},' +
                '{' +
                 '   "source": "3",' +
                  '  "target": "4",' +
                   ' "isDirected": "true"' +

                '},' +
                '{' +
                 '   "source": "4",' +
                  '  "target": "2",' +
                   ' "isDirected": "true"' +

                '},' +
                '{' +
                 '   "source": "4",' +
                  '  "target": "1",' +
                   ' "isDirected": "true"' +

                '},' +
                '{' +
                 '   "source": "5",' +
                  '  "target": "1",' +
                   ' "isDirected": "true"' +

'                }' +
 '           ]' +
  '      },' +
   '     "isDirected": "true"' +
    '}' +
'], "meta": { "name": "Вариант 28", "id": "47", "moduleId": "16" } }'

const data: string = '{"data": [ ' +
    '{' +
    '   "type": "graph", ' +
    '"isDirected": "true",'+
    '  "value": { ' +
    '     "vertices": [ ' +
    '        "1", ' +
    '       "2",' +
    '      "3",' +
    '     "4",' +
    '    "5"' +
    '],' +
    '"edges": [' +
    '   {' +
    '      "source": "1", ' +
    '     "target": "2",' +
    '    "isDirected": "true"' +

    '},' +
    '{' +
    '   "source": "2", ' +
    '  "target": "3",' +
    ' "isDirected": "true"' +

    '},' +
    '{' +
    '   "source": "3",' +
    '  "target": "4",' +
    ' "isDirected": "true"' +

    '},' +
    '{' +
    '   "source": "4",' +
    '  "target": "2",' +
    ' "isDirected": "true"' +

    '},' +
    '{' +
    '   "source": "4",' +
    '  "target": "1",' +
    ' "isDirected": "true"' +

    '},' +
    '{' +
    '   "source": "5",' +
    '  "target": "1",' +
    ' "isDirected": "true"' +
    '                }' +
    '           ]' +
    '      }' +
    '}' +
    '] }'


export default data_json;
