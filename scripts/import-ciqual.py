"""Extract only food labels and carbohydrate column from the official Ciqual workbook.
Usage: python3 scripts/import-ciqual.py /path/to/Table_Ciqual_2025.xlsx
No network or health data. Generated output is committed for offline operation.
"""
import hashlib, json, pathlib, re, sys, zipfile
import xml.etree.ElementTree as ET

source = pathlib.Path(sys.argv[1])
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(source) as z:
    strings = [''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', ns)]
    rows = ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:row', ns)
    def cells(row):
        result = {}
        for c in row:
            value = c.find('m:v', ns)
            if value is None:
                continue
            result[re.sub(r'\d+', '', c.attrib['r'])] = strings[int(value.text)] if c.attrib.get('t') == 's' else value.text
        return result
    header = cells(rows[0])
    assert header['G'] == 'alim_code' and header['H'] == 'alim_nom_fr'
    assert re.sub(r'\s+', ' ', header['Q']).strip() == 'Glucides (g 100 g)', 'Carbohydrate column changed'
    foods = []
    for row in rows[1:]:
        c = cells(row)
        if not c.get('G') or not c.get('H'):
            continue
        raw = c.get('Q', '-').strip()
        value = float(raw.replace(',', '.')) if re.fullmatch(r'\d+(?:[.,]\d+)?', raw) else None
        assert value is None or 0 <= value <= 100
        foods.append({'id': c['G'], 'nom': c['H'].replace('\n', ' '), 'glucidesPour100g': value, 'valeurSource': raw, 'groupe': c.get('D', '').replace('\n', ' '), 'categorie': c.get('E', '').replace('\n', ' ')})
assert len(foods) == 3484 and len({f['id'] for f in foods}) == len(foods)
output = pathlib.Path('lib/nutrition/ciqual-2025.json')
output.write_text(json.dumps({'source': 'ANSES — Table Ciqual 2025', 'url': 'https://doi.org/10.57745/RDMHWY', 'license': 'Licence Ouverte / Etalab 2.0', 'fileUrl': 'https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260', 'fileSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'column': 'Glucides (g/100 g)', 'foods': foods}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
print(f'{len(foods)} real Ciqual foods extracted to {output}')
