import openpyxl
import json
import os
import sys

def clean_num(val):
    if val is None or val == '': return None
    try:
        f = float(val)
        return int(f) if f.is_integer() else f
    except:
        return None

# Load Excel
wb = openpyxl.load_workbook('C:/Users/munna/Downloads/Floor area.XLSX', data_only=True)

# 1. Define standard architectural templates from Excel sheets
# Reconciling Length x Width = Area and matching Nominal Total
reconciled_templates = {}

# Sheet 320 -> 320 sqft Simplex
reconciled_templates['320'] = {
    'nominal_total': 320,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 320,
            'rooms': [
                {'section': 'Bed room 1', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 10, 'width': 10, 'area': 100},
                {'section': 'Kitchen', 'length': 6, 'width': 5, 'area': 30},
                {'section': 'Bath 1', 'length': 5, 'width': 4, 'area': 20},
                {'section': 'Varanda', 'length': 10, 'width': 2, 'area': 20},
                {'section': 'Walls & Circulation', 'length': None, 'width': None, 'area': 30}
            ]
        }
    }
}

# Sheet 400 -> 400 sqft Simplex
reconciled_templates['400'] = {
    'nominal_total': 400,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 400,
            'rooms': [
                {'section': 'Bed room 1', 'length': 10, 'width': 10, 'area': 100},
                {'section': 'Bed room 2', 'length': 10, 'width': 10, 'area': 100},
                {'section': 'Living room', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Kitchen', 'length': 6, 'width': 5, 'area': 30},
                {'section': 'Bath 1', 'length': 5, 'width': 4, 'area': 20},
                {'section': 'Walls & Circulation', 'length': None, 'width': None, 'area': 30}
            ]
        }
    }
}

# Sheet 550 -> 550 sqft Simplex
reconciled_templates['550'] = {
    'nominal_total': 550,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 550,
            'rooms': [
                {'section': 'Bed room 1', 'length': 13, 'width': 12, 'area': 156},
                {'section': 'Bed room 2', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 10, 'width': 10, 'area': 100},
                {'section': 'Kitchen', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 1', 'length': 6, 'width': 4, 'area': 24},
                {'section': 'Varanda', 'length': 12, 'width': 3, 'area': 36},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Walls & Circulation', 'length': None, 'width': None, 'area': 30}
            ]
        }
    }
}

# Sheet 600 -> 600 sqft Simplex
reconciled_templates['600'] = {
    'nominal_total': 600,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 600,
            'rooms': [
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Living room', 'length': 22, 'width': 10, 'area': 220},
                {'section': 'Kitchen', 'length': 10, 'width': 8, 'area': 80},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 24, 'width': 3, 'area': 72},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48}
            ]
        }
    }
}

# Sheet 700 -> 700 sqft Simplex
reconciled_templates['700'] = {
    'nominal_total': 700,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 700,
            'rooms': [
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Living room', 'length': 16, 'width': 12, 'area': 192},
                {'section': 'Kitchen', 'length': 10, 'width': 8, 'area': 80},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 10, 'width': 4, 'area': 40},
                {'section': 'Walls & Circulation', 'length': None, 'width': None, 'area': 28}
            ]
        }
    }
}

# Sheet 800 -> 800 sqft Simplex
reconciled_templates['800'] = {
    'nominal_total': 800,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 800,
            'rooms': [
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 21, 'width': 12, 'area': 252},
                {'section': 'Kitchen', 'length': 12, 'width': 6, 'area': 72},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 24, 'width': 4, 'area': 96},
                {'section': 'Portch', 'length': 8, 'width': 5.5, 'area': 44}
            ]
        }
    }
}

# Sheet 850 -> 850 sqft Simplex
reconciled_templates['850'] = {
    'nominal_total': 850,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 850,
            'rooms': [
                {'section': 'Master bedroom', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Drawing room', 'length': 16, 'width': 12, 'area': 192},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda1', 'length': 12, 'width': 4, 'area': 48},
                {'section': 'Portch', 'length': 10, 'width': 6, 'area': 60},
                {'section': 'Walls & Circulation', 'length': None, 'width': None, 'area': 34}
            ]
        }
    }
}

# Sheet 900 -> 900 sqft Simplex
reconciled_templates['900'] = {
    'nominal_total': 900,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 900,
            'rooms': [
                {'section': 'Master bedroom', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Drawing room', 'length': 20, 'width': 12, 'area': 240},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda 1', 'length': 12, 'width': 4, 'area': 48},
                {'section': 'Varanda 2', 'length': 12, 'width': 4, 'area': 48},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48}
            ]
        }
    }
}

# Sheet 1050 -> 1050 sqft Simplex
reconciled_templates['1050'] = {
    'nominal_total': 1050,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 1050,
            'rooms': [
                {'section': 'Master bed', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Child bedroom', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 16, 'width': 14, 'area': 224},
                {'section': 'Kitchen', 'length': 12, 'width': 6, 'area': 72},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 12, 'width': 4, 'area': 48},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Walls & Circulation', 'length': None, 'width': None, 'area': 10}
            ]
        }
    }
}

# Sheet 1200 -> 1200 sqft Simplex
reconciled_templates['1200'] = {
    'nominal_total': 1200,
    'is_duplex': False,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 1200,
            'rooms': [
                {'section': 'Master bed', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Child bedroom', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 24, 'width': 14, 'area': 336},
                {'section': 'Kitchen', 'length': 12, 'width': 6, 'area': 72},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 24, 'width': 4, 'area': 96},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48}
            ]
        }
    }
}

# DUPLEX TEMPLATES (2 Floors)
# Sheet 400D -> 800 sqft Duplex (400 per floor)
reconciled_templates['400D'] = {
    'nominal_total': 800,
    'is_duplex': True,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 400,
            'rooms': [
                {'section': 'Bed room 1', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Bed room 2', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 10, 'width': 10, 'area': 100},
                {'section': 'Kitchen', 'length': 6, 'width': 5, 'area': 30},
                {'section': 'Bath 1', 'length': 6, 'width': 5, 'area': 30}
            ]
        },
        'First Floor': {
            'target_subtotal': 400,
            'rooms': [
                {'section': 'Master bedroom', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Bed room 1', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Drawing room', 'length': 13, 'width': 10, 'area': 130},
                {'section': 'Bath 1', 'length': 6, 'width': 5, 'area': 30}
            ]
        }
    }
}

# Sheet 500D -> 1000 sqft Duplex (500 per floor)
reconciled_templates['500D'] = {
    'nominal_total': 1000,
    'is_duplex': True,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 500,
            'rooms': [
                {'section': 'Bed room 1', 'length': 13, 'width': 10, 'area': 130},
                {'section': 'Bed room 2', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 10, 'width': 10, 'area': 100},
                {'section': 'Kitchen', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 1', 'length': 6, 'width': 4, 'area': 24},
                {'section': 'Varanda', 'length': 12, 'width': 3, 'area': 36},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Walls & Circulation', 'length': None, 'width': None, 'area': 6}
            ]
        },
        'First Floor': {
            'target_subtotal': 500,
            'rooms': [
                {'section': 'Master bedroom', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 1', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Drawing room', 'length': 14, 'width': 10, 'area': 140},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Balcony', 'length': 8, 'width': 3, 'area': 24}
            ]
        }
    }
}

# Sheet 600D -> 1200 sqft Duplex (600 per floor)
reconciled_templates['600D'] = {
    'nominal_total': 1200,
    'is_duplex': True,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 600,
            'rooms': [
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Living room', 'length': 22, 'width': 10, 'area': 220},
                {'section': 'Kitchen', 'length': 10, 'width': 8, 'area': 80},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 24, 'width': 3, 'area': 72},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48}
            ]
        },
        'First Floor': {
            'target_subtotal': 600,
            'rooms': [
                {'section': 'Master bedroom', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Family Living', 'length': 16, 'width': 10, 'area': 160},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Balcony', 'length': 16, 'width': 5, 'area': 80}
            ]
        }
    }
}

# Sheet 800D -> 1600 sqft Duplex (800 per floor)
reconciled_templates['800D'] = {
    'nominal_total': 1600,
    'is_duplex': True,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 800,
            'rooms': [
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 10, 'area': 120},
                {'section': 'Living room', 'length': 21, 'width': 12, 'area': 252},
                {'section': 'Kitchen', 'length': 12, 'width': 6, 'area': 72},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 24, 'width': 4, 'area': 96},
                {'section': 'Portch', 'length': 8, 'width': 5.5, 'area': 44}
            ]
        },
        'First Floor': {
            'target_subtotal': 800,
            'rooms': [
                {'section': 'Master bedroom', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Drawing room', 'length': 16, 'width': 12, 'area': 192},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Balcony', 'length': 17, 'width': 4, 'area': 68}
            ]
        }
    }
}

# Sheet 900D -> 1800 sqft Duplex (900 per floor)
reconciled_templates['900D'] = {
    'nominal_total': 1800,
    'is_duplex': True,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 900,
            'rooms': [
                {'section': 'Master bedroom', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Drawing room', 'length': 20, 'width': 12, 'area': 240},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda 1', 'length': 12, 'width': 4, 'area': 48},
                {'section': 'Varanda 2', 'length': 12, 'width': 4, 'area': 48},
                {'section': 'Portch', 'length': 8, 'width': 6, 'area': 48}
            ]
        },
        'First Floor': {
            'target_subtotal': 900,
            'rooms': [
                {'section': 'Master bedroom', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 1', 'length': 13, 'width': 12, 'area': 156},
                {'section': 'Bed room 2', 'length': 13, 'width': 12, 'area': 156},
                {'section': 'Family Living', 'length': 20, 'width': 12, 'area': 240},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Balcony', 'length': 24, 'width': 4, 'area': 96}
            ]
        }
    }
}

# Sheet 2500 / Sheet8 -> 2500 sqft Duplex (1250 per floor)
reconciled_templates['2500'] = {
    'nominal_total': 2500,
    'is_duplex': True,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 1250,
            'rooms': [
                {'section': 'Master bedroom', 'length': 14, 'width': 14, 'area': 196},
                {'section': 'Bed room 1', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 2', 'length': 13, 'width': 12, 'area': 156},
                {'section': 'Grand Living Room', 'length': 24, 'width': 16, 'area': 384},
                {'section': 'Kitchen', 'length': 14, 'width': 8, 'area': 112},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Bath 2', 'length': 7, 'width': 6, 'area': 42},
                {'section': 'Front Verandah', 'length': 24, 'width': 4, 'area': 96},
                {'section': 'Entry Porch', 'length': 8, 'width': 6, 'area': 48}
            ]
        },
        'First Floor': {
            'target_subtotal': 1250,
            'rooms': [
                {'section': 'Executive Master Suite', 'length': 16, 'width': 14, 'area': 224},
                {'section': 'Bed room 1', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 2', 'length': 13, 'width': 12, 'area': 156},
                {'section': 'Family Lounge', 'length': 24, 'width': 14, 'area': 336},
                {'section': 'Master Bath', 'length': 10, 'width': 7, 'area': 70},
                {'section': 'Common Bath', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Executive Balcony', 'length': 25, 'width': 6, 'area': 150},
                {'section': 'Terrace Porch', 'length': 14, 'width': 7, 'area': 98}
            ]
        }
    }
}

# Sheet 2100 -> 2100 sqft Duplex (1050 per floor)
reconciled_templates['2100'] = {
    'nominal_total': 2100,
    'is_duplex': True,
    'floors': {
        'Ground Floor': {
            'target_subtotal': 1050,
            'rooms': [
                {'section': 'Master bed', 'length': 14, 'width': 12, 'area': 168},
                {'section': 'Bed room 1', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Bed room 2', 'length': 12, 'width': 12, 'area': 144},
                {'section': 'Living room', 'length': 22, 'width': 14, 'area': 308},
                {'section': 'Kitchen', 'length': 12, 'width': 6, 'area': 72},
                {'section': 'Bath 1', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Bath 2', 'length': 6, 'width': 6, 'area': 36},
                {'section': 'Varanda', 'length': 24, 'width': 4, 'area': 96},
                {'section': 'Portch', 'length': 8, 'width': 5.75, 'area': 46}
            ]
        },
        'First Floor': {
            'target_subtotal': 1050,
            'rooms': [
                {'section': 'Master bedroom', 'length': 15, 'width': 13, 'area': 195},
                {'section': 'Bed room 1', 'length': 13, 'width': 12, 'area': 156},
                {'section': 'Bed room 2', 'length': 13, 'width': 12, 'area': 156},
                {'section': 'Drawing room', 'length': 22, 'width': 12, 'area': 264},
                {'section': 'Bath 1', 'length': 8, 'width': 6, 'area': 48},
                {'section': 'Bath 2', 'length': 7, 'width': 6, 'area': 42},
                {'section': 'Balcony', 'length': 21.5, 'width': 6, 'area': 129},
                {'section': 'Upper Porch', 'length': 10, 'width': 6, 'area': 60}
            ]
        }
    }
}

print(f'Configured {len(reconciled_templates)} standard architectural templates')

# Verify each template's math.
# Every failure increments `errors` and the script exits non-zero, so a clean
# run is real evidence and CI can gate on it. Previously the success line
# printed unconditionally after the ERROR prints, which meant a passing run
# proved nothing.
errors = 0
for k, t in reconciled_templates.items():
    tot = 0
    for fl_name, fl in t['floors'].items():
        fl_sum = sum(r['area'] for r in fl['rooms'])
        target = fl['target_subtotal']
        if fl_sum != target:
            errors += 1
            print(f'ERROR in template {k} [{fl_name}]: sum={fl_sum} != target={target}')
        for r in fl['rooms']:
            if r['length'] and r['width']:
                if abs(r['length'] * r['width'] - r['area']) > 0.01:
                    errors += 1
                    print(f'ERROR in room {k} [{fl_name}] {r["section"]}: {r["length"]}x{r["width"]} != {r["area"]}')
        tot += fl_sum
    if tot != t['nominal_total']:
        errors += 1
        print(f'ERROR in template {k} Grand Total: {tot} != {t["nominal_total"]}')

if errors:
    print(f'FAILED: {errors} mathematical error(s) across {len(reconciled_templates)} templates.')
    sys.exit(1)

print(f'PASSED: {len(reconciled_templates)} templates, 0 mathematical errors.')
